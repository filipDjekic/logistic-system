import axios, { type AxiosError } from 'axios';
import { appEnv } from '../config/env';
import { authStore } from '../auth/authStore';
import { getAccessToken } from '../auth/token';
import type { ApiErrorResponse } from '../../shared/types/api.types';

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      authStore.setUnauthenticated();

      const requestUrl = error.config?.url ?? '';
      const isLoginRequest =
        typeof requestUrl === 'string' && requestUrl.includes('/api/auth/login');

      if (!isLoginRequest && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);