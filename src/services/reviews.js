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

export async function getOptions() {
  return request('/reviews/options', { method: 'GET' });
}

export async function listReviews({ seller, winner, product } = {}) {
  const params = {};
  if (seller) params.seller = seller;
  if (winner) params.winner = winner;
  if (product) params.product = product;
  return request('/reviews', { method: 'GET', params });
}

export async function getReview(id) {
  if (!id) throw new Error('id is required');
  return request(`/reviews/${id}`, { method: 'GET' });
}

export async function createReview({ seller, product, rating, quickFeedback, comment } = {}) {
  if (!seller) throw new Error('seller is required');
  if (!product) throw new Error('product is required');
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw new Error('rating must be 1..5');
  const payload = { seller, product, rating: r };
  if (Array.isArray(quickFeedback) && quickFeedback.length) payload.quickFeedback = quickFeedback;
  if (comment && String(comment).trim()) payload.comment = String(comment).trim();
  return request('/reviews', { method: 'POST', data: payload });
}

export async function updateReview(id, patch = {}) {
  if (!id) throw new Error('id is required');
  const body = {};
  if (patch.rating !== undefined) body.rating = Number(patch.rating);
  if (Array.isArray(patch.quickFeedback)) body.quickFeedback = patch.quickFeedback;
  if (patch.comment !== undefined) body.comment = String(patch.comment);
  return request(`/reviews/${id}`, { method: 'PATCH', data: body });
}

export default { getOptions, listReviews, getReview, createReview, updateReview };

