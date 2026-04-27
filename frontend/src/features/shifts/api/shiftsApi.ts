import { apiClient } from '../../../core/api/client';
import { unwrapPageContent, type PageResponse } from '../../../core/api/pagination';
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

function normalizeLocalDateTime(value: string) {
  if (!value) {
    return value;
  }

  return value.length === 16 ? `${value}:00` : value;
}

function normalizeShiftCreatePayload(payload: ShiftCreateRequest): ShiftCreateRequest {
  return {
    ...payload,
    startTime: normalizeLocalDateTime(payload.startTime),
    endTime: normalizeLocalDateTime(payload.endTime),
    notes: payload.notes?.trim() || '',
  };
}

function normalizeShiftUpdatePayload(payload: ShiftUpdateRequest): ShiftUpdateRequest {
  return {
    ...payload,
    startTime: normalizeLocalDateTime(payload.startTime),
    endTime: normalizeLocalDateTime(payload.endTime),
    notes: payload.notes?.trim() || '',
  };
}

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
    return apiClient
      .post<ShiftResponse>('/api/shifts', normalizeShiftCreatePayload(payload))
      .then((response) => response.data);
  },

  update(id: number, payload: ShiftUpdateRequest) {
    return apiClient
      .put<ShiftResponse>(`/api/shifts/${id}`, normalizeShiftUpdatePayload(payload))
      .then((response) => response.data);
  },

  getEmployees() {
    return apiClient
      .get<EmployeeResponse[] | PageResponse<EmployeeResponse>>('/api/employees', {
        params: { size: 1000, sort: 'lastName,asc' },
      })
      .then((response) =>
        unwrapPageContent(response.data).map<ShiftEmployeeOption>((employee) => ({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
        })),
      );
  },
};
