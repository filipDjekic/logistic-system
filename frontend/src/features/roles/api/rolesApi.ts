import { apiClient } from '../../../core/api/client';
import type { RoleResponse } from '../types/role.types';

export const rolesApi = {
  getAll() {
    return apiClient
      .get<RoleResponse[]>('/api/roles')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<RoleResponse>(`/api/roles/${id}`)
      .then((response) => response.data);
  },
};