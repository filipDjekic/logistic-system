import { apiClient } from '../../../core/api/client';
import type { ChangeHistoryResponse } from '../types/changeHistory.types';

export const changeHistoryApi = {
  getAll() {
    return apiClient
      .get<ChangeHistoryResponse[]>('/api/history')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<ChangeHistoryResponse>(`/api/history/${id}`)
      .then((response) => response.data);
  },

  getByEntityName(entityName: string) {
    return apiClient
      .get<ChangeHistoryResponse[]>(`/api/history/entity_name/${encodeURIComponent(entityName)}`)
      .then((response) => response.data);
  },

  getByEntityId(entityId: number) {
    return apiClient
      .get<ChangeHistoryResponse[]>(`/api/history/entity_id/${entityId}`)
      .then((response) => response.data);
  },

  getByUserId(userId: number) {
    return apiClient
      .get<ChangeHistoryResponse[]>(`/api/history/user_id/${userId}`)
      .then((response) => response.data);
  },

  getByBetweenDate(startDate: string, endDate: string) {
    return apiClient
      .get<ChangeHistoryResponse[]>(
        `/api/history/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`,
      )
      .then((response) => response.data);
  },
};