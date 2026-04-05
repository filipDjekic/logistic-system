import { apiClient } from '../../../core/api/client';
import type {
  ShiftCreateRequest,
  ShiftEmployeeOption,
  ShiftResponse,
  ShiftUpdateRequest,
} from '../types/shift.types';

type EmployeeResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export const shiftsApi = {
  getAll() {
    return apiClient.get<ShiftResponse[]>('/api/shifts').then((response) => response.data);
  },

  getMy() {
    return apiClient.get<ShiftResponse[]>('/api/shifts/my').then((response) => response.data);
  },

  getById(id: number) {
    return apiClient.get<ShiftResponse>(`/api/shifts/${id}`).then((response) => response.data);
  },

  create(payload: ShiftCreateRequest) {
    return apiClient.post<ShiftResponse>('/api/shifts', payload).then((response) => response.data);
  },

  update(id: number, payload: ShiftUpdateRequest) {
    return apiClient.put<ShiftResponse>(`/api/shifts/${id}`, payload).then((response) => response.data);
  },

  getEmployees() {
    return apiClient
      .get<EmployeeResponse[]>('/api/employees')
      .then((response) =>
        response.data.map<ShiftEmployeeOption>((employee) => ({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
        })),
      );
  },
};