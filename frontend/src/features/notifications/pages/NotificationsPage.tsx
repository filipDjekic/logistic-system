import { useEffect, useState } from 'react';
import { Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '../../../core/api/pagination';
import { getEntityDetailsPath } from '../../../core/utils/entityRoutes';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkNotificationAsRead } from '../hooks/useMarkNotificationAsRead';
import { useMarkAllNotificationsAsRead } from '../hooks/useMarkAllNotificationsAsRead';
import { useAcknowledgeNotification } from '../hooks/useAcknowledgeNotification';
import { useResolveNotification } from '../hooks/useResolveNotification';
import NotificationsList from '../components/NotificationsList';
import type { NotificationCategory, NotificationSeverity, NotificationStatus, NotificationType } from '../types/notification.types';

const statusOptions: Array<{ label: string; value: NotificationStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Unread', value: 'UNREAD' },
  { label: 'Read', value: 'READ' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Resolved', value: 'RESOLVED' },
];

const severityOptions: Array<{ label: string; value: NotificationSeverity | '' }> = [
  { label: 'All severities', value: '' },
  { label: 'Info', value: 'INFO' },
  { label: 'Warning', value: 'WARNING' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'Success', value: 'SUCCESS' },
];

const categoryOptions: Array<{ label: string; value: NotificationCategory | '' }> = [
  { label: 'All categories', value: '' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Inventory', value: 'INVENTORY' },
  { label: 'Task', value: 'TASK' },
  { label: 'Shift', value: 'SHIFT' },
  { label: 'Warehouse', value: 'WAREHOUSE' },
  { label: 'Security', value: 'SECURITY' },
];

const typeOptions: Array<{ label: string; value: NotificationType | '' }> = [
  { label: 'All types', value: '' },
  { label: 'Info', value: 'INFO' },
  { label: 'Warning', value: 'WARNING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Error', value: 'ERROR' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<NotificationStatus | ''>('');
  const [type, setType] = useState<NotificationType | ''>('');
  const [severity, setSeverity] = useState<NotificationSeverity | ''>('');
  const [category, setCategory] = useState<NotificationCategory | ''>('');

  useEffect(() => {
    setPage(0);
  }, [status, type, severity, category]);

  const notificationsQuery = useNotifications({ page, size, status, type, severity, category });
  const markAsReadMutation = useMarkNotificationAsRead();
  const acknowledgeMutation = useAcknowledgeNotification();
  const resolveMutation = useResolveNotification();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const criticalUnreadCount = notificationsQuery.data?.criticalUnreadCount ?? 0;
  const warningUnreadCount = notificationsQuery.data?.warningUnreadCount ?? 0;
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
        description="Review notification lifecycle: unread items require attention, acknowledged items are accepted for work, and resolved items are closed."
        actions={
          <Typography variant="body2" color="text.secondary">
            Unread: {unreadCount} · Critical: {criticalUnreadCount} · Warning: {warningUnreadCount}
          </Typography>
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Unread" contentSx={{ py: 2 }}>
            <Typography variant="h4" fontWeight={900}>{unreadCount}</Typography>
            <Typography variant="body2" color="text.secondary">Items waiting for review</Typography>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Critical" contentSx={{ py: 2 }}>
            <Typography variant="h4" fontWeight={900}>{criticalUnreadCount}</Typography>
            <Typography variant="body2" color="text.secondary">Critical unread notifications</Typography>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Warnings" contentSx={{ py: 2 }}>
            <Typography variant="h4" fontWeight={900}>{warningUnreadCount}</Typography>
            <Typography variant="body2" color="text.secondary">Warning unread notifications</Typography>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="My notifications"
        description="Notifications are grouped by operational source when possible. Use acknowledge when you accept ownership, resolve when the issue is finished, and open the workflow action when the notification points to an entity."
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as NotificationStatus | '')} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              {statusOptions.map((option) => <MenuItem key={option.label} value={option.value}>{option.label}</MenuItem>)}
            </TextField>

            <TextField select size="small" label="Type" value={type} onChange={(event) => setType(event.target.value as NotificationType | '')} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              {typeOptions.map((option) => <MenuItem key={option.label} value={option.value}>{option.label}</MenuItem>)}
            </TextField>

            <TextField select size="small" label="Severity" value={severity} onChange={(event) => setSeverity(event.target.value as NotificationSeverity | '')} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              {severityOptions.map((option) => <MenuItem key={option.label} value={option.value}>{option.label}</MenuItem>)}
            </TextField>

            <TextField select size="small" label="Category" value={category} onChange={(event) => setCategory(event.target.value as NotificationCategory | '')} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              {categoryOptions.map((option) => <MenuItem key={option.label} value={option.value}>{option.label}</MenuItem>)}
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
            onAcknowledge={(id) => {
              acknowledgeMutation.mutate(id);
            }}
            onResolve={(id) => {
              resolveMutation.mutate(id);
            }}
            onOpenSource={(notification) => {
              const path = notification.actionPath || getEntityDetailsPath({ sourceType: notification.sourceType, sourceId: notification.sourceId });
              if (!path) {
                return;
              }

              if (notification.status === 'UNREAD') {
                markAsReadMutation.mutate(notification.id);
              }

              navigate(path);
            }}
            markingNotificationId={markAsReadMutation.variables ?? null}
            acknowledgingNotificationId={acknowledgeMutation.variables ?? null}
            resolvingNotificationId={resolveMutation.variables ?? null}
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
