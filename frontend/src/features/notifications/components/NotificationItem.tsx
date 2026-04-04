import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import type { NotificationResponse } from '../types/notification.types';

type NotificationItemProps = {
  notification: NotificationResponse;
  onMarkAsRead?: (id: number) => void;
  isMarking?: boolean;
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
  isMarking = false,
}: NotificationItemProps) {
  const isUnread = notification.status === 'UNREAD';

  return (
    <ButtonBase
      onClick={() => {
        if (isUnread && onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
      }}
      disabled={isMarking}
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'block',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: isUnread ? 'action.hover' : 'background.paper',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'action.selected',
          },
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.25} alignItems="center">
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

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {notification.title}
            </Typography>

            <Box sx={{ ml: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {notification.type}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {notification.message}
          </Typography>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {formatNotificationDate(notification.createdAt)}
            </Typography>

            <Typography variant="caption" color={isUnread ? 'primary.main' : 'text.secondary'}>
              {notification.status}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </ButtonBase>
  );
}