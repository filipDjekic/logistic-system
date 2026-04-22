import { apiClient } from '../../../core/api/client';
import type {
  WarehouseCreateRequest,
  WarehouseEmployeeOption,
  WarehouseResponse,
  WarehouseStatus,
  WarehouseUpdateRequest,
} from '../types/warehouse.types';

export const warehousesApi = {
  getAll() {
    return apiClient
      .get<WarehouseResponse[]>('/api/warehouses')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<WarehouseResponse>(`/api/warehouses/${id}`)
      .then((response) => response.data);
  },

  create(data: WarehouseCreateRequest) {
    return apiClient
      .post<WarehouseResponse>('/api/warehouses', data)
      .then((response) => response.data);
  },

  update(id: number, data: WarehouseUpdateRequest) {
    return apiClient
      .put<WarehouseResponse>(`/api/warehouses/${id}`, data)
      .then((response) => response.data);
  },

  delete(id: number) {
    return apiClient.delete(`/api/warehouses/${id}`);
  },

  changeStatus(id: number, status: WarehouseStatus) {
    return apiClient
      .patch<WarehouseResponse>('/api/warehouses/warehouse/change-status', null, {
        params: { id, status },
      })
      .then((response) => response.data);
  },

    getManagers() {
      return apiClient.get<WarehouseEmployeeOption[]>('/api/employees').then((response) =>
        response.data
          .filter((employee: WarehouseEmployeeOption) => employee.position === 'WAREHOUSE_MANAGER')
          .map((employee: WarehouseEmployeeOption) => ({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            position: employee.position,
          })),
      );
    },
};