import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', params, token } = {}) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await client.request({
      url: path,
      method,
      params,
      headers,
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

export async function listNotifications({ token, limit, before, status } = {}) {
  if (!token) throw new Error('Missing auth token');
  const params = {};
  if (limit != null) params.limit = Math.min(Number(limit) || 20, 50);
  if (before) {
    try {
      const iso = new Date(before).toISOString();
      params.before = iso;
    } catch (_) {
      // ignore invalid before
    }
  }
  if (status && ['all', 'read', 'unread'].includes(String(status).toLowerCase())) {
    params.status = String(status).toLowerCase();
  }
  const data = await request('/notifications', { params, token });
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id, token) {
  if (!id) throw new Error('Notification id is required');
  if (!token) throw new Error('Missing auth token');
  const data = await request(`/notifications/${id}/read`, { method: 'PATCH', token });
  return data;
}

export async function markNotificationsReadBulk({ ids = [], token } = {}) {
  if (!token) throw new Error('Missing auth token');
  if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids is required');
  const data = await request('/notifications/read', { method: 'POST', data: { ids }, token });
  return data;
}

export default { listNotifications, markNotificationRead, markNotificationsReadBulk };
