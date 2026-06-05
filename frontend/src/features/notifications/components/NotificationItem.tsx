import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import type { NotificationResponse } from '../types/notification.types';

type NotificationItemProps = {
  notification: NotificationResponse;
  onMarkAsRead?: (id: number) => void;
  onAcknowledge?: (id: number) => void;
  onResolve?: (id: number) => void;
  onOpenSource?: (notification: NotificationResponse) => void;
  isMarking?: boolean;
  isAcknowledging?: boolean;
  isResolving?: boolean;
};

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onAcknowledge,
  onResolve,
  onOpenSource,
  isMarking = false,
  isAcknowledging = false,
  isResolving = false,
}: NotificationItemProps) {
  const isUnread = notification.status === 'UNREAD';
  const isAcknowledged = notification.status === 'ACKNOWLEDGED';
  const isResolved = notification.status === 'RESOLVED';
  const hasSource = Boolean(notification.actionPath || (notification.sourceType && notification.sourceId && notification.sourceType !== 'SYSTEM'));
  const groupCount = notification.groupCount ?? 1;
  const activityDate = notification.lastGroupedAt || notification.createdAt;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: isUnread ? 'action.hover' : 'background.paper',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            {isUnread ? (
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
            ) : null}

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
              {notification.title}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={notification.category ?? 'GENERAL'} variant="outlined" />
            <Chip
              size="small"
              label={notification.severity ?? notification.type}
              color={notification.severity === 'CRITICAL' ? 'error' : notification.severity === 'WARNING' ? 'warning' : notification.severity === 'SUCCESS' ? 'success' : 'info'}
            />
            <Chip size="small" label={notification.status} variant={isUnread ? 'filled' : 'outlined'} />
            {groupCount > 1 ? <Chip size="small" label={`x${groupCount}`} variant="outlined" /> : null}
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {notification.message}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.25}>
          <Typography variant="caption" color="text.secondary">
            {formatNotificationDate(activityDate)}{groupCount > 1 ? ' · grouped' : ''}{isAcknowledged && notification.acknowledgedAt ? ` · acknowledged ${formatNotificationDate(notification.acknowledgedAt)}` : ''}{isResolved && notification.resolvedAt ? ` · resolved ${formatNotificationDate(notification.resolvedAt)}` : ''}{notification.sourceType ? ` · ${notification.sourceType}${notification.sourceId ? ` #${notification.sourceId}` : ''}` : ''}
          </Typography>

          <Stack direction="row" spacing={1}>
            {isUnread ? (
              <Button size="small" variant="outlined" onClick={() => onMarkAsRead?.(notification.id)} disabled={isMarking}>
                Mark read
              </Button>
            ) : null}
            {isUnread ? (
              <Button size="small" variant="outlined" color="warning" onClick={() => onAcknowledge?.(notification.id)} disabled={isAcknowledging || isMarking}>
                Acknowledge
              </Button>
            ) : null}
            {!isResolved ? (
              <Button size="small" variant="outlined" color="success" onClick={() => onResolve?.(notification.id)} disabled={isResolving}>
                Resolve
              </Button>
            ) : null}
            {hasSource ? (
              <Button size="small" variant="contained" onClick={() => onOpenSource?.(notification)}>
                {notification.actionLabel || 'Open source'}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
