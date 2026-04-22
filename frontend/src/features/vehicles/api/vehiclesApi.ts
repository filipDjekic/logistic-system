import { apiClient } from '../../../core/api/client';
import type {
  VehicleCreateRequest,
  VehicleResponse,
  VehicleStatus,
  VehicleUpdateRequest,
} from '../types/vehicle.types';

export const vehiclesApi = {
  getAll() {
    return apiClient
      .get<VehicleResponse[]>('/api/vehicles')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<VehicleResponse>(`/api/vehicles/${id}`)
      .then((response) => response.data);
  },

  create(payload: VehicleCreateRequest) {
    return apiClient
      .post<VehicleResponse>('/api/vehicles', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: VehicleUpdateRequest) {
    return apiClient
      .put<VehicleResponse>(`/api/vehicles/${id}`, payload)
      .then((response) => response.data);
  },

  delete(id: number) {
    return apiClient.delete(`/api/vehicles/${id}`);
  },

  changeStatus(id: number, status: VehicleStatus) {
    return apiClient
      .patch<VehicleResponse>(`/api/vehicles/${id}/status`, null, {
        params: { status },
      })
      .then((response) => response.data);
  },
};