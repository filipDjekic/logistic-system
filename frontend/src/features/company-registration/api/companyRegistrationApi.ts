import { apiClient } from '../../../core/api/client';
import type {
  CompanyRegistrationCreateRequest,
  CompanyRegistrationResponse,
  CompanyRegistrationPublicStatus,
  CompanyRegistrationStatus,
  CompanyRegistrationValidationResponse,
} from '../types/companyRegistration.types';

export const companyRegistrationApi = {
  submit(payload: CompanyRegistrationCreateRequest) {
    return apiClient
      .post<CompanyRegistrationResponse>('/api/company-registration-requests', payload)
      .then((response) => response.data);
  },

  getPublicStatus(trackingToken: string) {
    return apiClient
      .get<CompanyRegistrationPublicStatus>(`/api/company-registration-requests/status/${encodeURIComponent(trackingToken)}`)
      .then((response) => response.data);
  },

  validate(params: {
    companyName?: string;
    registrationNumber?: string;
    taxNumber?: string;
    adminEmail?: string;
  }) {
    return apiClient
      .get<CompanyRegistrationValidationResponse>('/api/company-registration-requests/validate', { params })
      .then((response) => response.data);
  },

  getAll(status?: CompanyRegistrationStatus | '') {
    return apiClient
      .get<CompanyRegistrationResponse[]>('/api/company-registration-requests', {
        params: status ? { status } : undefined,
      })
      .then((response) => response.data);
  },

  markUnderReview(id: number) {
    return apiClient
      .post<CompanyRegistrationResponse>(`/api/company-registration-requests/${id}/under-review`)
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
