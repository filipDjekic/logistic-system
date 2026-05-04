import { useEffect, useState } from 'react';
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DEFAULT_PAGE_SIZE } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkNotificationAsRead } from '../hooks/useMarkNotificationAsRead';
import { useMarkAllNotificationsAsRead } from '../hooks/useMarkAllNotificationsAsRead';
import NotificationsList from '../components/NotificationsList';
import type { NotificationStatus, NotificationType } from '../types/notification.types';

const statusOptions: Array<{ label: string; value: NotificationStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Unread', value: 'UNREAD' },
  { label: 'Read', value: 'READ' },
];

const typeOptions: Array<{ label: string; value: NotificationType | '' }> = [
  { label: 'All types', value: '' },
  { label: 'Info', value: 'INFO' },
  { label: 'Warning', value: 'WARNING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Error', value: 'ERROR' },
];

export default function NotificationsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<NotificationStatus | ''>('');
  const [type, setType] = useState<NotificationType | ''>('');

  useEffect(() => {
    setPage(0);
  }, [status, type]);

  const notificationsQuery = useNotifications({ page, size, status, type });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const paginationPage = notificationsQuery.data
    ? {
        content: notificationsQuery.data.items,
        totalElements: notificationsQuery.data.totalElements,
        totalPages: notificationsQuery.data.totalPages,
        size: notificationsQuery.data.size,
        number: notificationsQuery.data.page,
        numberOfElements: notificationsQuery.data.items.length,
        first: notificationsQuery.data.page === 0,
        last: notificationsQuery.data.last,
        empty: notificationsQuery.data.items.length === 0,
      }
    : undefined;

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

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
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => {
                markAllAsReadMutation.mutate();
              }}
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                void notificationsQuery.refetch();
              }}
              disabled={notificationsQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as NotificationStatus | '')}
              sx={{ minWidth: { xs: '100%', sm: 180 } }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Type"
              value={type}
              onChange={(event) => setType(event.target.value as NotificationType | '')}
              sx={{ minWidth: { xs: '100%', sm: 180 } }}
            >
              {typeOptions.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

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

          <ServerTablePagination
            page={paginationPage}
            disabled={notificationsQuery.isFetching}
            onPageChange={setPage}
            onSizeChange={handleSizeChange}
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
