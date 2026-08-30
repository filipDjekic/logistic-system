import axios, { type AxiosError } from 'axios';
import { appEnv } from '../config/env';
import { authStore } from '../auth/authStore';
import { getAccessToken } from '../auth/token';
import type { ApiErrorResponse } from '../../shared/types/api.types';
import { applyIdempotencyKey } from './idempotency';
import { clearQueryCache } from '../query/queryClient';
import { emitSessionExpired } from '../auth/authEvents';

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

function isPublicApiRequest(requestUrl: string, requestMethod?: string) {
  const method = requestMethod?.toLowerCase();
  const path = requestUrl.split('?')[0];

  if (method === 'post') {
    return path === '/api/auth/login' || path === '/api/company-registration-requests';
  }

  return method === 'get' && (
    path === '/api/company-registration-requests/validate'
    || path.startsWith('/api/company-registration-requests/status/')
    || path === '/api/countries'
    || path.startsWith('/api/countries/')
    || path === '/api/cities'
    || path.startsWith('/api/cities/')
    || path === '/api/timezones'
    || path.startsWith('/api/timezones/')
  );
}

apiClient.interceptors.request.use((config) => {
  applyIdempotencyKey(config);
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      clearQueryCache();
      authStore.setUnauthenticated();

      const requestUrl = error.config?.url ?? '';
      if (!isPublicApiRequest(requestUrl, error.config?.method)) {
        emitSessionExpired();
      }
    }

    return Promise.reject(error);
  },
);
