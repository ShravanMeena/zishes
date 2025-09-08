import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(
  axios.create({ baseURL: API_BASE, timeout: 20000 })
);

async function request(path, { method = 'GET', params, data, headers, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      params,
      data,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
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

// GET /api/v1/fulfillments/product/:productId (auth required)
export async function getByProduct(productId, { token } = {}) {
  if (!productId) throw new Error('productId is required');
  return request(`/fulfillments/product/${productId}`, { method: 'GET', token });
}

// PATCH /api/v1/fulfillments/product/:productId/seller-proof (auth required)
export async function submitSellerProof(productId, payload = {}, { token } = {}) {
  if (!productId) throw new Error('productId is required');
  // Map legacy aliases -> new API fields
  const data = { ...payload };
  if (payload.deliveredAt && !payload.dateOfDelivery) data.dateOfDelivery = payload.deliveredAt;
  return request(`/fulfillments/product/${productId}/seller-proof`, { method: 'PATCH', data, token });
}

// PATCH /api/v1/fulfillments/product/:productId/receiver-proof (auth required)
export async function submitReceiverProof(productId, payload = {}, { token } = {}) {
  if (!productId) throw new Error('productId is required');
  const data = { ...payload };
  if (payload.deliveredAt && !payload.dateOfReceive) data.dateOfReceive = payload.deliveredAt;
  return request(`/fulfillments/product/${productId}/receiver-proof`, { method: 'PATCH', data, token });
}

export default { getByProduct, submitSellerProof, submitReceiverProof };
