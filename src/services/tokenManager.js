import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../store';
import { api } from './api';
import { tokenUpdated, logout } from '../store/auth/authSlice';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

export async function getAccessToken() {
  const state = store.getState?.();
  const inState = state?.auth?.token;
  if (inState) return inState;
  try { return await AsyncStorage.getItem(TOKEN_KEY); } catch {
    return null;
  }
}

export async function getRefreshToken() {
  const state = store.getState?.();
  const inState = state?.auth?.refreshToken;
  if (inState) return inState;
  try { return await AsyncStorage.getItem(REFRESH_KEY); } catch {
    return null;
  }
}

export async function setTokens({ accessToken, refreshToken }) {
  try {
    if (accessToken) await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {}
  try {
    store.dispatch(tokenUpdated({ token: accessToken || null, refreshToken: refreshToken || null }));
  } catch {}
}

// Try to refresh using the stored refresh token
export async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  // Call auth API verify/refresh endpoint, expecting tokens in headers
  const result = await api.verify({ refreshToken });
  const { accessToken, refreshToken: newRefresh } = result || {};
  if (!accessToken) throw new Error('Failed to refresh access token');
  await setTokens({ accessToken, refreshToken: newRefresh || refreshToken });
  return accessToken;
}

export async function clearTokens() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
  } catch {}
  try { store.dispatch(logout()); } catch {}
}

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  refreshAccessToken,
  clearTokens,
};

