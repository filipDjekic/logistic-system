import { apiClient } from '../../../core/api/client';
import type {
  EmployeeCreateRequest,
  EmployeeResponse,
  EmployeeShiftResponse,
  EmployeeTaskResponse,
  EmployeeUpdateRequest,
  EmployeeUserOption,
} from '../types/employee.types';

type UserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  status: string;
  roleId: number;
  roleName: string;
};

export const employeesApi = {
  getAll() {
    return apiClient
      .get<EmployeeResponse[]>('/api/employees')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<EmployeeResponse>(`/api/employees/${id}`)
      .then((response) => response.data);
  },

  create(payload: EmployeeCreateRequest) {
    return apiClient
      .post<EmployeeResponse>('/api/employees', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: EmployeeUpdateRequest) {
    return apiClient
      .put<EmployeeResponse>(`/api/employees/${id}`, payload)
      .then((response) => response.data);
  },

  terminate(id: number) {
    return apiClient.patch<void>(`/api/employees/terminate/${id}`).then((response) => response.data);
  },

  getTasksByEmployeeId(id: number) {
    return apiClient
      .get<EmployeeTaskResponse[]>(`/api/employees/${id}/tasks`)
      .then((response) => response.data);
  },

  getShiftsByEmployeeId(id: number) {
    return apiClient
      .get<EmployeeShiftResponse[]>(`/api/employees/${id}/shifts`)
      .then((response) => response.data);
  },

  getUsers() {
    return apiClient
      .get<UserResponse[]>('/api/users')
      .then((response) =>
        response.data.map<EmployeeUserOption>((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          enabled: user.enabled,
          status: user.status,
          roleId: user.roleId,
          roleName: user.roleName,
        })),
      );
  },
};