import { apiClient } from '../../../core/api/client';
import type { CityResponse } from '../types/city.types';

export const citiesApi = {
  getAll(activeOnly = true) {
    return apiClient
      .get<CityResponse[]>('/api/cities', { params: { activeOnly } })
      .then((response) => response.data);
  },

  getByCountry(countryId: number) {
    return apiClient
      .get<CityResponse[]>('/api/cities', { params: { countryId } })
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<CityResponse>(`/api/cities/${id}`)
      .then((response) => response.data);
  },
};
