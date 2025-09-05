import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { BACKEND_ORIGIN } from '../config/api';

// Admin categories live under /api/admin, not /api/v1
const client = attachAuthInterceptors(axios.create({ baseURL: `${BACKEND_ORIGIN}/api/admin`, timeout: 15000 }));

async function request(path, { method = 'GET', params } = {}) {
  try {
    const res = await client.request({ url: path, method, params });
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

export async function listCategories() {
  const data = await request('/categories', { method: 'GET' });
  // Expect array per spec
  return Array.isArray(data) ? data : (data?.data || []);
}

export default { listCategories };

