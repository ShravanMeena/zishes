import axios from 'axios';
import { Platform } from 'react-native';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 20000 }));

async function request(path, { method = 'POST', data, headers, token, onUploadProgress } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      data,
      onUploadProgress,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message = body?.message || body?.error || err?.message || 'Upload failed';
    const e = new Error(message);
    e.status = status;
    e.data = body;
    throw e;
  }
}

// Upload a single image file
// args: { uri, name?, type?, token }
export async function uploadImage({ uri, name, type, token, onUploadProgress }) {
  if (!uri) throw new Error('Missing image uri');
  const form = new FormData();
  const filename = name || uri.split('/').pop() || 'image.jpg';
  const mime = type || (filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const normalizedUri = Platform.OS === 'ios' && uri.startsWith('file://')
    ? uri.replace('file://', '')
    : uri;
  form.append('file', { uri: normalizedUri, name: filename, type: mime });
  // POST /api/v1/uploads/image
  const data = await request('/uploads/image', {
    method: 'POST',
    data: form,
    token,
    headers: {
      'Content-Type': 'multipart/form-data',
      Accept: 'application/json',
    },
    onUploadProgress,
  });
  return data; // { url, key, contentType, size, name }
}

export default { uploadImage };
