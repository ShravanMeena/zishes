import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', params, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.message || data?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = data;
    throw e;
  }
}

export async function getLeaderboard(productId, { page = 1, limit = 100, count = true, token } = {}) {
  if (!productId) throw new Error('product is required');
  const res = await request(`/leaderboard/${productId}`, { params: { page, limit, count: count ? 'true' : undefined }, token });
  // Normalize to { data, meta }
  if (Array.isArray(res)) {
    return { data: res, meta: { page, limit } };
  }
  if (res && typeof res === 'object') {
    if (Array.isArray(res.data)) return { data: res.data, meta: res.meta || { page, limit } };
    if (Array.isArray(res.result)) return { data: res.result, meta: res.meta || { page, limit } };
  }
  return { data: [], meta: { page, limit } };
}

export default { getLeaderboard };
