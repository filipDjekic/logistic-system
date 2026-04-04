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
  markingNotificationId?: number | null;
};

export default function NotificationsList({
  notifications,
  isLoading = false,
  isError = false,
  onRetry,
  onMarkAsRead,
  markingNotificationId = null,
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
          isMarking={markingNotificationId === notification.id}
        />
      ))}
    </Stack>
  );
}