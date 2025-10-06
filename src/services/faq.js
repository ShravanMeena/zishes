import axios from 'axios';
import { API_BASE } from '../config/api';
import { attachAuthInterceptors } from './http';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', params, data, headers } = {}) {
  try {
    const res = await client.request({ url: path, method, params, data, headers });
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

export async function getFAQs() {
  return request('/faq', { method: 'GET' });
}

export default {
  getFAQs,
};

