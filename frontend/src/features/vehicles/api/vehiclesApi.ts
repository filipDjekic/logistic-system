import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  VehicleBrandResponse,
  VehicleCreateRequest,
  VehicleModelResponse,
  VehicleResponse,
  VehicleSearchParams,
  VehicleStatus,
  VehicleUpdateRequest,
} from '../types/vehicle.types';

export const vehiclesApi = {
  getAll(params?: VehicleSearchParams & PageParams) {
    return apiClient
      .get<PageResponse<VehicleResponse>>('/api/vehicles', { params })
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

  getBrands() {
    return apiClient
      .get<VehicleBrandResponse[]>('/api/vehicle-catalog/brands')
      .then((response) => response.data);
  },

  getModelsByBrand(brandId: number) {
    return apiClient
      .get<VehicleModelResponse[]>(`/api/vehicle-catalog/brands/${brandId}/models`)
      .then((response) => response.data);
  },
};