import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  DriverWorkloadResponse,
  VehicleMaintenanceCreateRequest,
  VehicleMaintenanceFilters,
  VehicleMaintenanceResponse,
  VehicleMaintenanceUpdateRequest,
} from '../types/vehicleMaintenance.types';

export const vehicleMaintenanceApi = {
  getAll(params?: VehicleMaintenanceFilters & PageParams) {
    return apiClient
      .get<PageResponse<VehicleMaintenanceResponse>>('/api/vehicle-maintenance', { params })
      .then((response) => response.data);
  },

  create(payload: VehicleMaintenanceCreateRequest) {
    return apiClient
      .post<VehicleMaintenanceResponse>('/api/vehicle-maintenance', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: VehicleMaintenanceUpdateRequest) {
    return apiClient
      .put<VehicleMaintenanceResponse>(`/api/vehicle-maintenance/${id}`, payload)
      .then((response) => response.data);
  },

  start(id: number) {
    return apiClient
      .patch<VehicleMaintenanceResponse>(`/api/vehicle-maintenance/${id}/start`)
      .then((response) => response.data);
  },

  complete(id: number) {
    return apiClient
      .patch<VehicleMaintenanceResponse>(`/api/vehicle-maintenance/${id}/complete`)
      .then((response) => response.data);
  },

  cancel(id: number, cancelReason?: string) {
    return apiClient
      .patch<VehicleMaintenanceResponse>(`/api/vehicle-maintenance/${id}/cancel`, { cancelReason })
      .then((response) => response.data);
  },

  getDriverWorkload(employeeId: number, from?: string, to?: string) {
    return apiClient
      .get<DriverWorkloadResponse>(`/api/vehicle-maintenance/drivers/${employeeId}/workload`, { params: { from, to } })
      .then((response) => response.data);
  },
};
