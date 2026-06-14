import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  VehicleBrandResponse,
  VehicleCreateRequest,
  VehicleModelResponse,
  VehicleResponse,
  VehicleSearchParams,
  VehicleStatus,
  VehicleStatusUpdateRequest,
  VehicleUpdateRequest,
  AllowedStatusTransitionsResponse,
} from '../types/vehicle.types';

export type StatusCountResponse = {
  status: string;
  count: number;
};

export const vehiclesApi = {
  getAll(params?: VehicleSearchParams & PageParams) {
    return apiClient
      .get<PageResponse<VehicleResponse>>('/api/vehicles', { params })
      .then((response) => response.data);
  },


  getStatusCounts(params?: Omit<VehicleSearchParams, 'status'>) {
    return apiClient
      .get<StatusCountResponse[]>('/api/vehicles/status-counts', { params })
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

  archive(id: number) {
    return apiClient.patch<VehicleResponse>(`/api/vehicles/${id}/archive`).then((response) => response.data);
  },

  restore(id: number) {
    return apiClient.patch<VehicleResponse>(`/api/vehicles/${id}/restore`).then((response) => response.data);
  },

  delete(id: number) {
    return apiClient.delete<void>(`/api/vehicles/${id}`).then((response) => response.data);
  },

  getAllowedStatusTransitions(id: number) {
    return apiClient
      .get<AllowedStatusTransitionsResponse<VehicleStatus>>(`/api/vehicles/${id}/status-transitions`)
      .then((response) => response.data);
  },

  changeStatus(id: number, status: VehicleStatus, reason?: string, expectedVersion?: number) {
    const payload: VehicleStatusUpdateRequest = { status, reason, expectedVersion };
    return apiClient
      .patch<VehicleResponse>(`/api/vehicles/${id}/status`, payload)
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