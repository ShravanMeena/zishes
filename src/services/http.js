import axios from 'axios';
import { clearTokens, getAccessToken, refreshAccessToken } from './tokenManager';

let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

export function attachAuthInterceptors(client) {
  // Add Authorization header if not present
  client.interceptors.request.use(async (config) => {
    try {
      const hasAuth = !!(config.headers && (config.headers.Authorization || config.headers.authorization));
      if (!hasAuth) {
        const token = await getAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {}
    return config;
  });

  // Refresh on 401 and retry once
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;

      if (status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const hadAuthHeader = !!(originalRequest.headers && (originalRequest.headers.Authorization || originalRequest.headers.authorization));

      if (!hadAuthHeader) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        try {
          const newToken = await new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject });
          });
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client.request(originalRequest);
        } catch (err) {
          await clearTokens();
          return Promise.reject(err);
        }
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client.request(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await clearTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return client;
}

export default attachAuthInterceptors;
