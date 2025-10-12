import axios from 'axios';
import { API_BASE } from '../config/api';
import { attachAuthInterceptors } from './http';

const client = attachAuthInterceptors(
  axios.create({ baseURL: API_BASE, timeout: 20000 })
);

async function request(path, { method = 'GET', data, params, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      data,
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    try {
      console.log('[fulfillments] response', { path, method, data: res?.data });
    } catch (_) {}
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message =
      body?.message || body?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = body;
    throw e;
  }
}

export async function getByProduct(productId, { token } = {}) {
  if (!productId) throw new Error('productId is required');
  return request(`/fulfillments/product/${productId}`, {
    method: 'GET',
    token,
  });
}

export async function submitSellerProof(productId, payload, { token } = {}) {
  if (!productId) throw new Error('productId is required');
  return request(`/fulfillments/product/${productId}/seller-proof`, {
    method: 'PATCH',
    data: payload,
    token,
  });
}

export async function submitReceiverProof(productId, payload, { token } = {}) {
  if (!productId) throw new Error('productId is required');
  return request(`/fulfillments/product/${productId}/receiver-proof`, {
    method: 'PATCH',
    data: payload,
    token,
  });
}

export default {
  getByProduct,
  submitSellerProof,
  submitReceiverProof,
};
