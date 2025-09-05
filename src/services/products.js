import axios from 'axios';
import { attachAuthInterceptors } from './http';

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

export async function listProducts({ page = 1, limit = 20, count = false, user } = {}) {
  // API spec: Base Path `/products` (public)
  const data = await request('/products', { params: { page, limit, count: count ? 'true' : undefined, user } });
  // Expect shape: { result, meta }
  if (Array.isArray(data)) return { result: data, meta: { page, limit } };
  return data || { result: [], meta: { page, limit } };
}

export async function getProductById(id, token) {
  if (!id) throw new Error('Missing product id');
  // Auth required
  const data = await request(`/products/${id}`, { token });
  return data;
}

export default { listProducts, getProductById };
