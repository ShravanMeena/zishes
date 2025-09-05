import axios from 'axios';
import { attachAuthInterceptors } from './http';

// Keep consistent with products service origin
const ORIGIN = 'https://d7051ae0f1cf.ngrok-free.app/api/v1';

const client = attachAuthInterceptors(axios.create({ baseURL: ORIGIN, timeout: 15000 }));

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
  const data = await request(`/leaderboard/${productId}`, { params: { page, limit, count: count ? 'true' : undefined }, token });
  if (Array.isArray(data)) return { result: data.data, meta: { page, limit } };
  return data || { result: [], meta: { page, limit } };
}

export default { getLeaderboard };
