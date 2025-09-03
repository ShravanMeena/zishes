import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

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
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, accessToken),
      refreshToken ? AsyncStorage.setItem(REFRESH_KEY, refreshToken) : Promise.resolve(),
    ]);
    return { token: accessToken, refreshToken: refreshToken || null, user: { email } };
  } catch (err) {
    return rejectWithValue(err.message || 'Login failed');
  }
});

export const signup = createAsyncThunk('auth/signup', async ({ email, password }, { rejectWithValue }) => {
  try {
    const result = await api.register({ email, password });
    const { accessToken, refreshToken } = result;
    if (!accessToken) throw new Error('Missing access token');
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, accessToken),
      refreshToken ? AsyncStorage.setItem(REFRESH_KEY, refreshToken) : Promise.resolve(),
    ]);
    return { token: accessToken, refreshToken: refreshToken || null, user: { email } };
  } catch (err) {
    return rejectWithValue(err.message || 'Signup failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_KEY),
  ]);
  return true;
});

export const completeVerification = createAsyncThunk('auth/completeVerification', async () => true);

const initialState = {
  token: null,
  refreshToken: null,
  user: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  bootstrapped: false,
  needsVerification: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // bootstrap
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = 'idle';
        state.bootstrapped = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.status = 'idle';
        state.bootstrapped = true;
      })
      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.needsVerification = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      // signup
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.needsVerification = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Signup failed';
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.status = 'idle';
        state.needsVerification = false;
      })
      .addCase(completeVerification.fulfilled, (state) => {
        state.needsVerification = false;
      });
  },
});

export default authSlice.reducer;
