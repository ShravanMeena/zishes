import axios from 'axios';
import { API_BASE } from '../config/api';
import { attachAuthInterceptors } from './http';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 20000 }));

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

// Normalize API response { data: {...} } -> {...}
function unwrap(res) {
  return res?.data ?? res ?? null;
}

// GET /api/v1/payment-methods/me
export async function getMyPaymentMethods() {
  const res = await request('/payment-methods/me');
  return unwrap(res);
}

// PUT /api/v1/payment-methods/me (compat append)
export async function appendViaPut({ upi, bankDetails, makeDefault } = {}) {
  const payload = {};
  if (upi !== undefined) payload.upi = upi;
  if (bankDetails !== undefined) payload.bankDetails = bankDetails;
  if (makeDefault !== undefined) payload.makeDefault = !!makeDefault;
  const res = await request('/payment-methods/me', { method: 'PUT', data: payload });
  return unwrap(res);
}

// POST /api/v1/payment-methods/upi
export async function addUpi({ upi, makeDefault } = {}) {
  const res = await request('/payment-methods/upi', { method: 'POST', data: { upi, makeDefault: !!makeDefault } });
  return unwrap(res);
}

// POST /api/v1/payment-methods/bank
export async function addBank(details = {}) {
  const { accountNumber, ifsc, bankName, accountHolderName, branchName, branchDetails, makeDefault } = details || {};
  const body = { accountNumber, ifsc, bankName, accountHolderName, branchName, branchDetails, makeDefault: !!makeDefault };
  const res = await request('/payment-methods/bank', { method: 'POST', data: body });
  return unwrap(res);
}

// POST /api/v1/payment-methods/default
export async function setDefault({ type, id }) {
  const res = await request('/payment-methods/default', { method: 'POST', data: { type, id } });
  return unwrap(res);
}

// DELETE /api/v1/payment-methods/upi/:id
export async function deleteUpi(id) {
  const res = await request(`/payment-methods/upi/${id}`, { method: 'DELETE' });
  return unwrap(res);
}

// DELETE /api/v1/payment-methods/bank/:id
export async function deleteBank(id) {
  const res = await request(`/payment-methods/bank/${id}`, { method: 'DELETE' });
  return unwrap(res);
}

export default {
  getMyPaymentMethods,
  appendViaPut,
  addUpi,
  addBank,
  setDefault,
  deleteUpi,
  deleteBank,
};
