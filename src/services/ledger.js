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

// GET /api/v1/ledger/me
// Optional filter: { tournament }
export async function getMyLedger({ tournament, token } = {}) {
  const params = {};
  if (tournament) params.tournament = tournament;
  const data = await request('/ledger/me', { params, token });
  // Expect array
  return Array.isArray(data) ? data : (data?.data || []);
}

export default { getMyLedger };
