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

// GET /api/v1/feedback?email=
export async function listFeedback({ email, token, guest } = {}) {
  const params = {};
  if (email) params.email = email;
  const headers = guest ? { guest: 'true' } : undefined;
  return request('/feedback', { method: 'GET', params, headers, token });
}

// GET /api/v1/feedback/:id
export async function getFeedback(id, { token, guest } = {}) {
  if (!id) throw new Error('id is required');
  const headers = guest ? { guest: 'true' } : undefined;
  return request(`/feedback/${id}`, { method: 'GET', headers, token });
}

// POST /api/v1/feedback (auth required)
export async function createFeedback({ message, email, token } = {}) {
  if (!message || !message.trim()) {
    const e = new Error('message is required');
    e.status = 400;
    throw e;
  }
  if (!email || !email.trim()) {
    const e = new Error('email is required');
    e.status = 400;
    throw e;
  }
  const payload = { message: message.trim(), email: email.trim() };
  return request('/feedback', { method: 'POST', data: payload, token });
}

// PATCH /api/v1/feedback/:id (owner only)
export async function updateFeedback(id, patch = {}, { token } = {}) {
  if (!id) throw new Error('id is required');
  if (!patch || Object.keys(patch).length === 0) throw new Error('No fields to update');
  return request(`/feedback/${id}`, { method: 'PATCH', data: patch, token });
}

// DELETE /api/v1/feedback/:id (owner only)
export async function deleteFeedback(id, { token } = {}) {
  if (!id) throw new Error('id is required');
  return request(`/feedback/${id}`, { method: 'DELETE', token });
}

export default { listFeedback, getFeedback, createFeedback, updateFeedback, deleteFeedback };

