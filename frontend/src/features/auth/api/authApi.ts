import { apiClient } from '../../../core/api/client';
import type { AuthMeResponse, LoginRequest, LoginResponse } from '../types/auth.types';

export const authApi = {
  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>('/api/auth/login', payload).then((response) => response.data);
  },

  me() {
    return apiClient.get<AuthMeResponse>('/api/auth/me').then((response) => response.data);
  },
};
