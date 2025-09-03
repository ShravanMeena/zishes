// Auth API client hitting your backend
const BASE_URL = 'https://auth.traferr-prod.com/api/v1/auth';

function getHeader(headers, key) {
  // Headers in fetch are case-insensitive, but normalize for safety
  return (
    headers.get(key) ||
    headers.get(key.toLowerCase()) ||
    headers.get(key.toUpperCase()) ||
    null
  );
}

async function postJson(path, body) {
  console.log("ahs",  `${BASE_URL}${path}`)
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });


  // Attempt to parse response body (may be empty)
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

  // Extract tokens from headers
  const accessToken = getHeader(res.headers, 'st-access-token');
  const refreshToken = getHeader(res.headers, 'st-refresh-token');

  return { data, accessToken, refreshToken };
}

export const api = {
  signin: ({ email, password }) => postJson('/signin', { email, password }),
  signup: ({ email, password }) => postJson('/signup', { email, password }),
  verify: (payload) => postJson('/verify', payload || {}),
  // Backward-compatible aliases
  login: ({ email, password }) => postJson('/signin', { email, password }),
  register: ({ email, password }) => postJson('/signup', { email, password }),
};

export default api;
