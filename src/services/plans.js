import axios from 'axios';
import { API_BASE } from '../config/api';

const client = axios.create({ baseURL: API_BASE, timeout: 15000 });

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

// GET /api/v1/plans
export async function listPlans({ country, page = 1, limit = 20, count = false } = {}) {
  const params = { page, limit };
  if (country && String(country).trim()) params.country = country;
  if (count) params.count = 'true';
  const data = await request('/plans', { params });
  // Prefer new shape { data, meta }; fallback to legacy array
  if (Array.isArray(data)) return { data: data.data, meta: { page, limit } };
  return data || { data: [], meta: { page, limit } };
}

export default { listPlans };
