import { apiClient } from '../../../core/api/client';
import type {
  EmployeeProfileChangeRequestResponse,
  EmployeeProfileChangeRequestsPageResponse,
  EmployeeProfileChangeRequestStatus,
  GetEmployeeProfileChangeRequestsParams,
  RejectEmployeeProfileChangeRequestPayload,
} from '../types/employeeProfileChangeRequest.types';

export const employeeProfileChangeRequestsApi = {
  getAll(params: GetEmployeeProfileChangeRequestsParams = {}) {
    return apiClient
      .get<EmployeeProfileChangeRequestsPageResponse>('/api/employee-profile-change-requests', {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? 'createdAt,desc',
          status: params.status || undefined,
        },
      })
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<EmployeeProfileChangeRequestResponse>(`/api/employee-profile-change-requests/${id}`)
      .then((response) => response.data);
  },

  approve(id: number) {
    return apiClient
      .patch<EmployeeProfileChangeRequestResponse>(`/api/employee-profile-change-requests/${id}/approve`)
      .then((response) => response.data);
  },

  reject(id: number, payload: RejectEmployeeProfileChangeRequestPayload) {
    return apiClient
      .patch<EmployeeProfileChangeRequestResponse>(`/api/employee-profile-change-requests/${id}/reject`, payload)
      .then((response) => response.data);
  },
};

export const profileChangeRequestStatuses: Array<EmployeeProfileChangeRequestStatus | ''> = [
  '',
  'PENDING',
  'APPLIED',
  'REJECTED',
  'CANCELLED',
];
