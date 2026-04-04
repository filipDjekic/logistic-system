import type { ApiPageResponse } from '../../../shared/types/api.types';

export type NotificationStatus = 'UNREAD' | 'READ';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export type NotificationResponse = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string;
  userId: number;
};

export type NotificationPageResponse = ApiPageResponse<NotificationResponse> & {
  unreadCount: number;
};

export type GetMyNotificationsParams = {
  page?: number;
  size?: number;
};