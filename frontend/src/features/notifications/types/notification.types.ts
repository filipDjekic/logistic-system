import type { ApiPageResponse } from '../../../shared/types/api.types';

export type NotificationStatus = 'UNREAD' | 'READ';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export type NotificationCategory = 'GENERAL' | 'TRANSPORT' | 'INVENTORY' | 'TASK' | 'SHIFT' | 'WAREHOUSE' | 'SECURITY';

export type NotificationSourceType = 'SYSTEM' | 'TRANSPORT_ORDER' | 'WAREHOUSE_INVENTORY' | 'TASK' | 'SHIFT' | 'WAREHOUSE' | 'USER';

export type NotificationResponse = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  severity: NotificationSeverity;
  category: NotificationCategory;
  sourceType: NotificationSourceType;
  sourceId: number | null;
  dedupKey: string | null;
  escalatedAt: string | null;
  createdAt: string;
  userId: number;
};

export type NotificationPageResponse = ApiPageResponse<NotificationResponse> & {
  unreadCount: number;
  criticalUnreadCount: number;
  warningUnreadCount: number;
};

export type GetMyNotificationsParams = {
  page?: number;
  size?: number;
  status?: NotificationStatus | '';
  type?: NotificationType | '';
  severity?: NotificationSeverity | '';
  category?: NotificationCategory | '';
};