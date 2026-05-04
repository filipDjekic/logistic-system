import { apiClient } from '../../../core/api/client';
import type { TimezoneResponse } from '../types/timezone.types';

export const timezonesApi = {
  getActive() {
    return apiClient
      .get<TimezoneResponse[]>('/api/timezones/active')
      .then((response) => response.data);
  },

  getByCountry(countryId: number) {
    return apiClient
      .get<TimezoneResponse[]>(`/api/timezones/country/${countryId}`)
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<TimezoneResponse>(`/api/timezones/${id}`)
      .then((response) => response.data);
  },
};