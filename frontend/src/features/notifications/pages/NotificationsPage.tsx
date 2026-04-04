import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkNotificationAsRead } from '../hooks/useMarkNotificationAsRead';
import NotificationsList from '../components/NotificationsList';

export default function NotificationsPage() {
  const [page] = useState(0);
  const [size] = useState(20);

  const notificationsQuery = useNotifications({ page, size });
  const markAsReadMutation = useMarkNotificationAsRead();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Workspace"
        title="Notifications"
        description="View your latest system notifications and mark unread items as read."
        actions={
          <Typography variant="body2" color="text.secondary">
            Unread: {unreadCount}
          </Typography>
        }
      />

      <SectionCard
        title="My notifications"
        description="Notifications are ordered by creation date descending."
        action={
          <Button
            variant="outlined"
            onClick={() => {
              void notificationsQuery.refetch();
            }}
            disabled={notificationsQuery.isFetching}
          >
            Refresh
          </Button>
        }
      >
        <NotificationsList
          notifications={notifications}
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          onRetry={() => {
            void notificationsQuery.refetch();
          }}
          onMarkAsRead={(id) => {
            markAsReadMutation.mutate(id);
          }}
          markingNotificationId={markAsReadMutation.variables ?? null}
        />
      </SectionCard>
    </Stack>
  );
}