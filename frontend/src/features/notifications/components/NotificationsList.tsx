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
  onOpenSource?: (notification: NotificationResponse) => void;
  markingNotificationId?: number | null;
};

function NotificationsList({
  notifications,
  isLoading = false,
  isError = false,
  onRetry,
  onMarkAsRead,
  onOpenSource,
  markingNotificationId = null,
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
            onOpenSource={onOpenSource}
            isMarking={markingNotificationId === notification.id}
          />
        ))}
      </Stack>
    </QueryStateBoundary>
  );
}

export default memo(NotificationsList);
