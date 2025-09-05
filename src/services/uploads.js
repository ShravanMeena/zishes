import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 20000 }));

function guessNameFromUri(uri) {
  try {
    const path = uri.split('?')[0];
    const parts = path.split('/')
    const last = parts[parts.length - 1] || '';
    if (last && last.includes('.')) return last;
  } catch {}
  return 'upload.jpg';
}

function guessMimeFromUri(uri) {
  const u = (uri || '').toLowerCase();
  if (u.endsWith('.png')) return 'image/png';
  if (u.endsWith('.webp')) return 'image/webp';
  if (u.endsWith('.heic') || u.endsWith('.heif')) return 'image/heic';
  if (u.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

// POST /api/v1/uploads/image
// Body: multipart/form-data with field `file`
// Returns: { url, key, contentType, size, name }
export async function uploadImage(input) {
  const asset = input || {};
  const uri = asset.uri || asset.path || null;
  if (!uri) throw new Error('Invalid image input');
  const name = asset.fileName || asset.name || guessNameFromUri(uri);
  const type = asset.type || guessMimeFromUri(uri);

  const form = new FormData();
  form.append('file', { uri, name, type });

  try {
    const res = await client.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.message || data?.error || err?.message || 'Failed to upload image';
    const e = new Error(message);
    e.status = status;
    e.data = data;
    throw e;
  }
}

export default { uploadImage };
