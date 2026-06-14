import { memo } from 'react';
import { Stack } from '@mui/material';
import QueryStateBoundary from '../../../shared/components/QueryStateBoundary';
import type { NotificationResponse } from '../types/notification.types';
import NotificationItem from './NotificationItem';

type NotificationsListProps = {
  notifications: NotificationResponse[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onMarkAsRead?: (id: number) => void;
  onAcknowledge?: (id: number) => void;
  onResolve?: (id: number) => void;
  onOpenSource?: (notification: NotificationResponse) => void;
  markingNotificationId?: number | null;
  acknowledgingNotificationId?: number | null;
  resolvingNotificationId?: number | null;
};

function NotificationsList({
  notifications,
  isLoading = false,
  isError = false,
  onRetry,
  onMarkAsRead,
  onAcknowledge,
  onResolve,
  onOpenSource,
  markingNotificationId = null,
  acknowledgingNotificationId = null,
  resolvingNotificationId = null,
}: NotificationsListProps) {
  return (
    <QueryStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={notifications.length === 0}
      loadingMessage="Loading notifications..."
      errorTitle="Notifications could not be loaded"
      errorDescription="An error occurred while loading your notifications."
      emptyTitle="No notifications"
      emptyDescription="You currently do not have any notifications."
      onRetry={onRetry}
    >
      <Stack spacing={1.5}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onAcknowledge={onAcknowledge}
            onResolve={onResolve}
            onOpenSource={onOpenSource}
            isMarking={markingNotificationId === notification.id}
            isAcknowledging={acknowledgingNotificationId === notification.id}
            isResolving={resolvingNotificationId === notification.id}
          />
        ))}
      </Stack>
    </QueryStateBoundary>
  );
}

export default memo(NotificationsList);
