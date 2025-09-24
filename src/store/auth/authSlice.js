import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../../services/api';
import { createUser as createZishesUser } from '../../services/users';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Buffer } from 'buffer';

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
    if (__DEV__) {
      console.log('[Auth] Signup success. Access token:', accessToken);
      try {
        console.log('[Auth] Signup tokens', JSON.stringify({ accessToken, refreshToken: refreshToken || null }));
      } catch {}
    }
    // After successful auth, create user in Zishes API (ignore duplicates)
    try {
      await createZishesUser({ email, token: accessToken });
    } catch (e) {
      const status = e?.status;
      if (status !== 409 && status !== 401 && status !== 403) {
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
    const signInResult = await GoogleSignin.signIn();
    const googlePayload = signInResult?.data ? signInResult.data : signInResult;
    const googleUser = googlePayload?.user || signInResult?.user || null;

    const tokenBundle = Platform.OS === 'android'
      ? await GoogleSignin.getTokens().catch(() => ({}))
      : {};

    let idToken = googlePayload?.idToken || tokenBundle?.idToken;
    let accessToken = googlePayload?.accessToken || tokenBundle?.accessToken || null;

    if (!idToken || !accessToken) {
      if (Platform.OS === 'android') {
        try {
          const refreshed = await GoogleSignin.getTokens();
          idToken = refreshed?.idToken || idToken;
          accessToken = refreshed?.accessToken || accessToken;
        } catch (tokenErr) {
          // eslint-disable-next-line no-console
          console.warn('[Auth] getTokens fallback failed:', tokenErr?.message || tokenErr);
        }
      }
    }

    if (!idToken) {
      throw new Error('Missing Google ID token');
    }

    if (!accessToken) {
      throw new Error('Missing Google access token');
    }

    const decodeJwtPayload = (token) => {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      try {
        const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const json = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(json);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Auth] Failed to decode Google ID token payload', err?.message || err);
        return null;
      }
    };

    const claims = decodeJwtPayload(idToken) || {};
    const normalizedUser = {
      id: googleUser?.id || claims?.sub || null,
      email: googleUser?.email || claims?.email || null,
      name: googleUser?.name || claims?.name || [claims?.given_name, claims?.family_name].filter(Boolean).join(' ') || null,
      givenName: googleUser?.givenName || claims?.given_name || null,
      familyName: googleUser?.familyName || claims?.family_name || null,
      photo: googleUser?.photo || null,
    };

    const clientType = Platform.OS === 'ios' ? 'ios' : 'android';
    const summarizeToken = (token) => {
      if (!token || typeof token !== 'string') return null;
      if (token.length <= 16) return token;
      return `${token.slice(0, 8)}…${token.slice(-8)}`;
    };

    const exchangePayload = {
      idToken,
      accessToken,
      clientType,
      user: {
        type: 'google',
        data: {
          serverAuthCode: googlePayload?.serverAuthCode || signInResult?.serverAuthCode || null,
          idToken,
          accessToken,
          user: normalizedUser,
        },
      },
    };

    try {
      console.log('[Auth] Google exchange request', JSON.stringify({
        clientType,
        idToken: idToken,
        accessToken: accessToken,
        user: {
          ...normalizedUser,
          photo: normalizedUser.photo ? '[set]' : null,
        },
      }));
    } catch {}

    let exchange;
    try {
      exchange = await api.googleSignin(exchangePayload);
    } catch (apiErr) {
      const status = apiErr?.status || apiErr?.response?.status || null;
      const data = apiErr?.data || apiErr?.response?.data || null;
      try {
        console.warn('[Auth] Google exchange failed', JSON.stringify({
          status,
          message: apiErr?.message || null,
          data,
        }));
      } catch {}
      throw apiErr;
    }

    const exchangeData = exchange?.data || exchange || {};
    const backendAccessToken = exchangeData?.access_token
    const backendRefreshToken =  exchangeData?.refresh_token
    if (!backendAccessToken) {
      throw new Error('Missing backend access token');
    }

    const expiry = exchangeData?.expiry || null;
    const backendUserId = exchangeData?.user_id || exchangeData?.userId || null;
    const status = exchangeData?.status || null;

    try {
      console.log('[Auth] Google exchange success', JSON.stringify({
        clientType,
        backendUserId,
        expiry,
        status,
        hasAccessToken: !!backendAccessToken,
        hasRefreshToken: !!backendRefreshToken,
      }));
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] Failed logging Google exchange payload', logErr?.message || logErr);
    }

    await AsyncStorage.setItem(TOKEN_KEY, backendAccessToken);
    if (backendRefreshToken) await AsyncStorage.setItem(REFRESH_KEY, backendRefreshToken);
    else await AsyncStorage.removeItem(REFRESH_KEY);

    return {
      token: backendAccessToken,
      refreshToken: backendRefreshToken || null,
      user: {
        id: backendUserId || normalizedUser.id,
        email: normalizedUser.email || exchangeData?.email || null,
        name: normalizedUser.name || exchangeData?.name || null,
        photo: normalizedUser.photo || null,
        provider: 'google',
        status,
        expiry,
        accessToken: backendAccessToken,
      },
      accessToken: backendAccessToken,
    };
  } catch (err) {
    let message = err?.message || 'Google sign-in failed';
    try {
      console.warn('[Auth] Google sign-in error details', JSON.stringify({
        message,
        code: err?.code || null,
        stack: err?.stack || null,
      }));
    } catch {}
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
        state.needsVerification = false;
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
