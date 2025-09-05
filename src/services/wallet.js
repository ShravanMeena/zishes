import axios from 'axios';
import { attachAuthInterceptors } from './http';

// Keep consistent with other services
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

// GET /api/v1/wallet/me
export async function getMyWallet(token) {
  if (!token) throw new Error('UNAUTHORIZED');
  const data = await request('/wallet/me', { token });
  // Expect: { availableZishCoins: number, withdrawalBalance: number }
  return data?.data || { availableZishCoins: 0, withdrawalBalance: 0 };
}

export default { getMyWallet };
