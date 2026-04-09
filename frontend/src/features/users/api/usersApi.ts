import { apiClient } from '../../../core/api/client';
import type {
  UserCreateRequest,
  UserResponse,
  UserUpdateRequest,
} from '../types/user.types';

export const usersApi = {
  getAll() {
    return apiClient
      .get<UserResponse[]>('/api/users')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<UserResponse>(`/api/users/${id}`)
      .then((response) => response.data);
  },

  create(payload: UserCreateRequest) {
    return apiClient
      .post<UserResponse>('/api/users', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: UserUpdateRequest) {
    return apiClient
      .put<UserResponse>(`/api/users/${id}`, payload)
      .then((response) => response.data);
  },

  enable(id: number) {
    return apiClient
      .patch<void>(`/api/users/${id}/enable`)
      .then((response) => response.data);
  },

  disable(id: number) {
    return apiClient
      .patch<void>(`/api/users/${id}/disable`)
      .then((response) => response.data);
  },
};