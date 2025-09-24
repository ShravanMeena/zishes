import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { getToken } from './tokenManager';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', params, data, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      params,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const resData = err?.response?.data;
    const message = resData?.message || resData?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = resData;
    throw e;
  }
}

// POST /api/v1/users
export async function createUser({ email, address, token } = {}) {
  if (!email) {
    const e = new Error('email is required');
    e.status = 400;
    throw e;
  }
  const payload = { email };
  if (address && typeof address === 'object') payload.address = address;
  // Must include Bearer from auth.traferr
  const data = await request('/users', { method: 'POST', data: payload, token });
  return data;
}

// GET /api/v1/users/me
export async function getMe() {
  const data = await request('/users/me', { method: 'GET' });
  return data;
}

// PATCH /api/v1/users/me
export async function updateMe(patch = {}, opts = {}) {
  if (!patch || Object.keys(patch).length === 0) {
    throw new Error('No valid fields to update');
  }

  console.log(opts,"opts")
  const supplied = opts?.token;
  let bearer = supplied;
  if (!bearer) {
    try {
      bearer = await getToken();
    } catch {}
  }
  if (!bearer) {
    const e = new Error('Missing auth token');
    e.status = 401;
    throw e;
  }

  try {
    const data = await request('/users/me', { method: 'PATCH', data: patch, token: bearer });
    return data;
  } catch (err) {
    const status = err?.status || err?.response?.status || null;
    const serverData = err?.data || err?.response?.data || null;
    const message = err?.message || serverData?.message || serverData?.error || 'Update failed';
    try {
      // eslint-disable-next-line no-console
      console.warn('[users.updateMe] failed', JSON.stringify({ status, message, data: serverData }));
    } catch {}
    throw err;
  }
}

export default { createUser, getMe, updateMe };
