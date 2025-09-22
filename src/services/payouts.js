import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', data, params, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      data,
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message = body?.message || body?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = body;
    throw e;
  }
}

export async function requestPayout({ amount, productId, token }) {
  const body = productId ? { amount, productId } : { amount };
  return request('/payouts/request', { method: 'POST', data: body, token });
}

export async function getTaxes(amount) {
  return request('/payouts/taxes', { params: { amount } });
}

export default { request: requestPayout, getTaxes };
