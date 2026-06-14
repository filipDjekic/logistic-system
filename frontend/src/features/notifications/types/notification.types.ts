import type { ItemsPageResponse } from '../../../shared/types/api.types';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ACKNOWLEDGED' | 'RESOLVED';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export type NotificationCategory = 'GENERAL' | 'TRANSPORT' | 'INVENTORY' | 'TASK' | 'SHIFT' | 'WAREHOUSE' | 'SECURITY';

export type NotificationSourceType = 'SYSTEM' | 'TRANSPORT_ORDER' | 'WAREHOUSE_INVENTORY' | 'TASK' | 'SHIFT' | 'WAREHOUSE' | 'USER' | 'STOCK_MOVEMENT';

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
  groupKey: string | null;
  groupCount: number | null;
  lastGroupedAt: string | null;
  escalatedAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  actionLabel: string | null;
  actionPath: string | null;
  createdAt: string;
  userId: number;
};

export type NotificationPageResponse = ItemsPageResponse<NotificationResponse> & {
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

export type NotificationStreamEventType = 'CONNECTED' | 'CREATED' | 'UPDATED' | 'BULK_UPDATED' | 'HEARTBEAT';

export type NotificationStreamEventResponse = {
  eventType: NotificationStreamEventType;
  notification: NotificationResponse | null;
  unreadCount: number | null;
};
