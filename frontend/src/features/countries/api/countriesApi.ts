import { apiClient } from '../../../core/api/client';
import type { CountryResponse } from '../types/country.types';

export const countriesApi = {
  getAll() {
    return apiClient
      .get<CountryResponse[]>('/api/countries')
      .then((response) => response.data);
  },

  getActive() {
    return apiClient
      .get<CountryResponse[]>('/api/countries/active')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<CountryResponse>(`/api/countries/${id}`)
      .then((response) => response.data);
  },

  getByCode(code: string) {
    return apiClient
      .get<CountryResponse>(`/api/countries/code/${code}`)
      .then((response) => response.data);
  },
};