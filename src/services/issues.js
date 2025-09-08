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

// POST /api/v1/issues (auth required)
export async function createIssue({ description, category, attachments = [], token } = {}) {
  if (!description || !description.trim()) {
    const e = new Error('description is required');
    e.status = 400;
    throw e;
  }
  if (!category || !category.trim()) {
    const e = new Error('category is required');
    e.status = 400;
    throw e;
  }
  const payload = { description: description.trim(), category: category.trim() };
  if (Array.isArray(attachments) && attachments.length) payload.attachments = attachments;
  return request('/issues', { method: 'POST', data: payload, token });
}

// GET /api/v1/issues?category=&mine=
export async function listIssues({ category, mine, token, guest } = {}) {
  const params = {};
  if (category) params.category = category;
  if (typeof mine === 'boolean') params.mine = mine;
  const headers = guest ? { guest: 'true' } : undefined;
  return request('/issues', { method: 'GET', params, headers, token });
}

// GET /api/v1/issues/:id
export async function getIssue(id, { token, guest } = {}) {
  if (!id) throw new Error('id is required');
  const headers = guest ? { guest: 'true' } : undefined;
  return request(`/issues/${id}`, { method: 'GET', headers, token });
}

// PATCH /api/v1/issues/:id (auth required; owner only)
export async function updateIssue(id, patch = {}, { token } = {}) {
  if (!id) throw new Error('id is required');
  if (!patch || Object.keys(patch).length === 0) throw new Error('No fields to update');
  return request(`/issues/${id}`, { method: 'PATCH', data: patch, token });
}

// DELETE /api/v1/issues/:id (auth required; owner only)
export async function deleteIssue(id, { token } = {}) {
  if (!id) throw new Error('id is required');
  return request(`/issues/${id}`, { method: 'DELETE', token });
}

export default { createIssue, listIssues, getIssue, updateIssue, deleteIssue };

