import { memo } from 'react';
import { Stack } from '@mui/material';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
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
  if (isLoading) {
    return <InlineLoader message="Loading notifications..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Notifications could not be loaded"
        description="An error occurred while loading your notifications."
        onRetry={onRetry}
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications"
        description="You currently do not have any notifications."
      />
    );
  }

  return (
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
  );
}

export default memo(NotificationsList);
