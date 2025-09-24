import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { AUTH_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: AUTH_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', data, params, token } = {}) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await client.request({ url: path, method, data, params, headers });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;
    const message = payload?.message || payload?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = payload;
    throw e;
  }
}

export async function forgotPassword(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('Email is required');
  }
  const data = await request('/auth/forgot-password', {
    method: 'POST',
    data: { email: trimmed },
  });
  return data;
}

export default { forgotPassword };
