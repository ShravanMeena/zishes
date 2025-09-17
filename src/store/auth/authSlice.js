import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../../services/api';
import { createUser as createZishesUser } from '../../services/users';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const [token, refreshToken] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  return { token: token || null, refreshToken: refreshToken || null };
});

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const result = await api.login({ email, password });


    const { accessToken, refreshToken } = result;
    if (!accessToken) throw new Error('Missing access token');
    // Log token for debugging as requested
    console.log('[Auth] Login success. Access token:', accessToken);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, accessToken),
      refreshToken ? AsyncStorage.setItem(REFRESH_KEY, refreshToken) : Promise.resolve(),
    ]);
    return { token: accessToken, refreshToken: refreshToken || null, user: { email, provider: 'password' } };
  } catch (err) {
    return rejectWithValue(err.message || 'Login failed');
  }
});

export const signup = createAsyncThunk('auth/signup', async ({ email, password }, { rejectWithValue, dispatch }) => {
  try {
    const result = await api.register({ email, password });
    const { accessToken, refreshToken } = result;
    if (!accessToken) throw new Error('Missing access token');
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, accessToken),
      refreshToken ? AsyncStorage.setItem(REFRESH_KEY, refreshToken) : Promise.resolve(),
    ]);
    // Make token available in Redux immediately for interceptors
    try { dispatch(tokenUpdated({ token: accessToken, refreshToken: refreshToken || null })); } catch {}
    console.log('[Auth] Signup success. Access token:', accessToken);
    // After successful auth, create user in Zishes API (ignore duplicates)
    try {
      await createZishesUser({ email, token: accessToken });
    } catch (e) {
      if (e?.status !== 409) {
        // Non-duplicate errors can be logged for debugging
        console.warn('Create user failed:', e?.message || e);
      }
    }
    return { token: accessToken, refreshToken: refreshToken || null, user: { email, provider: 'password' } };
  } catch (err) {
    return rejectWithValue(err.message || 'Signup failed');
  }
});

export const authenticateWithGoogle = createAsyncThunk('auth/googleSignIn', async (_, { rejectWithValue }) => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const tokenBundle = Platform.OS === 'android'
      ? await GoogleSignin.getTokens().catch(() => ({}))
      : {};
      console.log(userInfo,"userInfouserInfouserInfo")
    let idToken = userInfo?.idToken || tokenBundle?.idToken;
    let accessToken = tokenBundle?.accessToken || null;

    if (!idToken) {
      try {
        const refreshed = await GoogleSignin.getTokens();
        idToken = refreshed?.idToken || idToken;
        accessToken = refreshed?.accessToken || accessToken;
      } catch (tokenErr) {
        // eslint-disable-next-line no-console
        console.warn('[Auth] getTokens fallback failed:', tokenErr?.message || tokenErr);
      }
    }

    if (!idToken) {
      throw new Error('Missing Google ID token');
    }

    try {
      console.log('[Auth] Google sign-in success', JSON.stringify({
        idToken,
        accessToken,
        user: userInfo || null,
      }));
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] Failed logging Google sign-in payload', logErr?.message || logErr);
    }

    await AsyncStorage.setItem(TOKEN_KEY, idToken);
    await AsyncStorage.removeItem(REFRESH_KEY);

    return {
      token: idToken,
      refreshToken: null,
      user: {
        id: userInfo?.user?.id || null,
        email: userInfo?.user?.email || null,
        name: userInfo?.user?.name || null,
        photo: userInfo?.user?.photo || null,
        provider: 'google',
        accessToken,
      },
      accessToken,
    };
  } catch (err) {
    let message = err?.message || 'Google sign-in failed';
    const code = err?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) message = 'Google sign-in was cancelled';
    else if (code === statusCodes.IN_PROGRESS) message = 'Google sign-in already in progress';
    else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) message = 'Google Play Services is not available or out of date';
    return rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
  try {
    await GoogleSignin.signOut();
  } catch (err) {
    if (__DEV__) {
      console.warn('[Auth] Google sign-out failed', err?.message || err);
    }
  }
  return true;
});

export const completeVerification = createAsyncThunk('auth/completeVerification', async () => true);

const initialState = {
  token: null,
  refreshToken: null,
  user: null,
  provider: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  bootstrapped: false,
  needsVerification: false,
  currentAuthMethod: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenUpdated: (state, action) => {
      state.token = action.payload?.token || null;
      state.refreshToken = action.payload?.refreshToken || null;
    },
    setUser: (state, action) => {
      state.user = action.payload || null;
    },
  },
  extraReducers: (builder) => {
    builder
      // bootstrap
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.currentAuthMethod = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = 'idle';
        state.bootstrapped = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.currentAuthMethod = null;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.status = 'idle';
        state.bootstrapped = true;
        state.currentAuthMethod = null;
      })
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.currentAuthMethod = 'password';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.needsVerification = false;
        state.provider = 'password';
        state.currentAuthMethod = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
        state.currentAuthMethod = null;
      })
      // signup
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.currentAuthMethod = 'password';
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.needsVerification = true;
        state.provider = 'password';
        state.currentAuthMethod = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Signup failed';
        state.currentAuthMethod = null;
      })
      // google sign-in
      .addCase(authenticateWithGoogle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.currentAuthMethod = 'google';
      })
      .addCase(authenticateWithGoogle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.refreshToken = null;
        state.user = action.payload.user;
        state.needsVerification = false;
        state.provider = 'google';
        state.currentAuthMethod = null;
      })
      .addCase(authenticateWithGoogle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Google sign-in failed';
        state.currentAuthMethod = null;
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.status = 'idle';
        state.needsVerification = false;
        state.provider = null;
        state.currentAuthMethod = null;
        state.error = null;
      })
      .addCase(completeVerification.fulfilled, (state) => {
        state.needsVerification = false;
      });
  },
});

export const { tokenUpdated, setUser } = authSlice.actions;
export default authSlice.reducer;
