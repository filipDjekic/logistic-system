import { apiClient } from '../../../core/api/client';
import type {
  CompanyCreateRequest,
  CompanyResponse,
  CompanyUpdateRequest,
} from '../types/company.types';

export const companiesApi = {
  getAll() {
    return apiClient
      .get<CompanyResponse[]>('/api/companies')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<CompanyResponse>(`/api/companies/${id}`)
      .then((response) => response.data);
  },

  create(payload: CompanyCreateRequest) {
    return apiClient
      .post<CompanyResponse>('/api/companies', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: CompanyUpdateRequest) {
    return apiClient
      .put<CompanyResponse>(`/api/companies/${id}`, payload)
      .then((response) => response.data);
  },

  delete(id: number) {
    return apiClient.delete<void>(`/api/companies/${id}`).then((response) => response.data);
  },
};