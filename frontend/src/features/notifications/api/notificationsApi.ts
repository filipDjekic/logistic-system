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
      .patch<NotificationResponse>(`/api/notifications/${id}/mark_as_read`)
      .then((response) => response.data);
  },
};