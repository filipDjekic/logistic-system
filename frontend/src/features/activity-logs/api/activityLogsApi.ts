import { apiClient } from '../../../core/api/client';
import type { ActivityLogResponse } from '../types/activityLog.types';

export const activityLogsApi = {
  getAll() {
    return apiClient
      .get<ActivityLogResponse[]>('/api/activity_logs')
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<ActivityLogResponse>(`/api/activity_logs/${id}`)
      .then((response) => response.data);
  },

  getByUserId(userId: number) {
    return apiClient
      .get<ActivityLogResponse[]>(`/api/activity_logs/user/${userId}`)
      .then((response) => response.data);
  },

  getByUserIdAndAction(userId: number, action: string) {
    return apiClient
      .get<ActivityLogResponse[]>(`/api/activity_logs/user/${userId}/action/${encodeURIComponent(action)}`)
      .then((response) => response.data);
  },

  getByUserIdAndEntityName(userId: number, entityName: string) {
    return apiClient
      .get<ActivityLogResponse[]>(
        `/api/activity_logs/user/${userId}/entity/${encodeURIComponent(entityName)}`,
      )
      .then((response) => response.data);
  },

  getByUserIdBefore(userId: number, date: string) {
    return apiClient
      .get<ActivityLogResponse[]>(`/api/activity_logs/user/${userId}/before`, {
        params: { date },
      })
      .then((response) => response.data);
  },

  getByUserIdAfter(userId: number, date: string) {
    return apiClient
      .get<ActivityLogResponse[]>(`/api/activity_logs/user/${userId}/after`, {
        params: { date },
      })
      .then((response) => response.data);
  },

  getByUserIdBetween(userId: number, start: string, end: string) {
    return apiClient
      .get<ActivityLogResponse[]>(`/api/activity_logs/user/${userId}/between`, {
        params: { start, end },
      })
      .then((response) => response.data);
  },
};