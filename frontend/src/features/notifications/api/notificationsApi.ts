import { apiClient } from '../../../core/api/client';
import type {
  GetMyNotificationsParams,
  NotificationPageResponse,
  NotificationResponse,
} from '../types/notification.types';

export const notificationsApi = {
  getMyNotifications(params: GetMyNotificationsParams = {}) {
    return apiClient
      .get<NotificationPageResponse>('/api/notifications/my', {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          status: params.status || undefined,
          type: params.type || undefined,
          severity: params.severity || undefined,
          category: params.category || undefined,
        },
      })
      .then((response) => response.data);
  },

  getMyUnreadCount() {
    return apiClient
      .get<number>('/api/notifications/my/unread/count')
      .then((response) => response.data);
  },

  markAsRead(id: number) {
    return apiClient
      .patch<NotificationResponse>(`/api/notifications/${id}/mark-as-read`)
      .then((response) => response.data);
  },

  acknowledge(id: number) {
    return apiClient
      .patch<NotificationResponse>(`/api/notifications/${id}/acknowledge`)
      .then((response) => response.data);
  },

  resolve(id: number) {
    return apiClient
      .patch<NotificationResponse>(`/api/notifications/${id}/resolve`)
      .then((response) => response.data);
  },

  markAllMyAsRead() {
    return apiClient
      .patch<void>('/api/notifications/my/mark-all-as-read')
      .then((response) => response.data);
  },
};