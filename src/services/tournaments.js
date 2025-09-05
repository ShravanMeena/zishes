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

export async function joinTournament(tournamentId, token) {
  if (!tournamentId) throw new Error('Invalid tournament id');
  if (!token) throw new Error('Unauthorized');
  return request(`/tournaments/${tournamentId}/join`, { method: 'POST', token });
}

export async function submitScore(tournamentId, score, { avatar, token } = {}) {
  if (!tournamentId) throw new Error('Invalid tournament id');
  if (!Number.isFinite(Number(score))) throw new Error('Invalid score');
  const data = { score: Number(score) };
  if (avatar) data.avatar = avatar;
  return request(`/tournaments/${tournamentId}/score`, { method: 'POST', data, token });
}

export async function getJoinedTournaments({ token } = {}) {
  // Returns tournaments that the authenticated user has enrolled in
  // GET /api/v1/tournaments/joined (auth required)
  return request('/tournaments/joined', { method: 'GET', token });
}

export default { joinTournament, submitScore, getJoinedTournaments };
