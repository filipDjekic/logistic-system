import { apiClient } from '../../../core/api/client';
import type {
  CompanyRegistrationCreateRequest,
  CompanyRegistrationResponse,
  CompanyRegistrationStatus,
} from '../types/companyRegistration.types';

export const companyRegistrationApi = {
  submit(payload: CompanyRegistrationCreateRequest) {
    return apiClient
      .post<CompanyRegistrationResponse>('/api/company-registration-requests', payload)
      .then((response) => response.data);
  },

  getAll(status?: CompanyRegistrationStatus | '') {
    return apiClient
      .get<CompanyRegistrationResponse[]>('/api/company-registration-requests', {
        params: status ? { status } : undefined,
      })
      .then((response) => response.data);
  },

  approve(id: number) {
    return apiClient
      .post<CompanyRegistrationResponse>(`/api/company-registration-requests/${id}/approve`)
      .then((response) => response.data);
  },

  reject(id: number, rejectionReason: string) {
    return apiClient
      .post<CompanyRegistrationResponse>(`/api/company-registration-requests/${id}/reject`, { rejectionReason })
      .then((response) => response.data);
  },
};
