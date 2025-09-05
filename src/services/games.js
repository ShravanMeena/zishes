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

// Public: list published games (no auth required)
export async function listPublishedGames() {
  const data = await request('/games/published');
  return Array.isArray(data) ? data : [];
}

// Auth: list all games (includes drafts)
export async function listAllGames(token) {
  if (!token) throw new Error('Unauthorized');
  const data = await request('/games', { token });
  return Array.isArray(data) ? data : [];
}

export default { listPublishedGames, listAllGames };

