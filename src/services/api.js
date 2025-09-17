// Auth API client (auth domain). Handles /auth/* and /users endpoints
// const BASE_URL = 'https://auth.traferr-prod.com/api/v1';
const BASE_URL = 'https://widely-intense-albacore.ngrok-free.app/api/v1';
const AUTH_ORIGIN = BASE_URL.replace(/\/?api\/?v1\/?$/, '');
const GOOGLE_CALLBACK_PATH = '/auth/callback/google';

function getHeader(headers, key) {
  // Headers in fetch are case-insensitive, but normalize for safety
  return (
    headers.get(key) ||
    headers.get(key.toLowerCase()) ||
    headers.get(key.toUpperCase()) ||
    null
  );
}

function buildQuery(params) {
  if (!params || typeof params !== 'object') return '';
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) return '';
  const qs = new URLSearchParams();
  entries.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, String(v)));
    } else {
      qs.append(key, String(value));
    }
  });
  const query = qs.toString();
  return query ? `?${query}` : '';
}

async function parseJsonResponse(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const accessToken = getHeader(res.headers, 'st-access-token');
  const refreshToken = getHeader(res.headers, 'st-refresh-token');

  return { data, accessToken, refreshToken };
}

async function postJson(path, body, opts = {}) {
  const token = opts?.token;
  console.log(opts,"tokentokentoken")
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return parseJsonResponse(res);
}

async function getJson(path, params, opts = {}) {
  const token = opts?.token;
  const query = buildQuery(params);
  const res = await fetch(`${BASE_URL}${path}${query}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return parseJsonResponse(res);
}

export const api = {
  // Auth endpoints
  signin: ({ email, password }) => postJson('/auth/signin', { email, password }),
  signup: ({ email, password }) => postJson('/auth/signup', { email, password }),
  verify: (params) => getJson('/auth/verify', params || {}),
  googleSignin: (payload) => postJson('/auth/google/signin', payload || {}),
  googleCallback: () => `${AUTH_ORIGIN}${GOOGLE_CALLBACK_PATH}`,
  // Users (on auth domain)
  createUser: ({ email, address, token }) => postJson('/users', { email, address }, { token }),
  // Backward-compatible aliases
  login: ({ email, password }) => postJson('/auth/signin', { email, password }),
  register: ({ email, password }) => postJson('/auth/signup', { email, password }),
};

export default api;
