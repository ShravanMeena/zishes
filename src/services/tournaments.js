import axios from 'axios';
import { attachAuthInterceptors } from './http';

const ORIGIN = 'https://d7051ae0f1cf.ngrok-free.app/api/v1';

const client = attachAuthInterceptors(axios.create({ baseURL: ORIGIN, timeout: 15000 }));

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

export default { joinTournament, submitScore };
