import { apiClient } from '../../../core/api/client';
import type {
  EmployeeWarehouseAssignmentCreateRequest,
  EmployeeWarehouseAssignmentResponse,
  EmployeeWarehouseAssignmentUpdateRequest,
} from '../types/employeeWarehouseAssignment.types';

export const employeeWarehouseAssignmentsApi = {
  getByEmployee(employeeId: number) {
    return apiClient
      .get<EmployeeWarehouseAssignmentResponse[]>(`/api/employee-warehouse-assignments/employee/${employeeId}`)
      .then((response) => response.data);
  },

  getByWarehouse(warehouseId: number) {
    return apiClient
      .get<EmployeeWarehouseAssignmentResponse[]>(`/api/employee-warehouse-assignments/warehouse/${warehouseId}`)
      .then((response) => response.data);
  },

  create(payload: EmployeeWarehouseAssignmentCreateRequest) {
    return apiClient
      .post<EmployeeWarehouseAssignmentResponse>('/api/employee-warehouse-assignments', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: EmployeeWarehouseAssignmentUpdateRequest) {
    return apiClient
      .put<EmployeeWarehouseAssignmentResponse>(`/api/employee-warehouse-assignments/${id}`, payload)
      .then((response) => response.data);
  },

  delete(id: number) {
    return apiClient.delete<void>(`/api/employee-warehouse-assignments/${id}`);
  },
};
