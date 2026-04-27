import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type { ActivityLogQueryParams, ActivityLogResponse } from '../types/activityLog.types';

export const activityLogsApi = {
  getAll(params?: ActivityLogQueryParams & PageParams) {
    return apiClient
      .get<PageResponse<ActivityLogResponse>>('/api/activity_logs', { params })
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