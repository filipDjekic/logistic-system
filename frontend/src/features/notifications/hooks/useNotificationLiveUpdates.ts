import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';

export function useNotificationLiveUpdates(unreadCount: number | undefined) {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const previousUnreadCountRef = useRef<number | null>(null);
  const lastToastedNotificationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof unreadCount !== 'number') {
      return;
    }

    const previousUnreadCount = previousUnreadCountRef.current;
    previousUnreadCountRef.current = unreadCount;

    if (previousUnreadCount === null || unreadCount <= previousUnreadCount) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root() });

    void notificationsApi
      .getMyNotifications({ page: 0, size: 1, status: 'UNREAD' })
      .then((response) => {
        const latestNotification = response.items[0];

        if (!latestNotification || latestNotification.id === lastToastedNotificationIdRef.current) {
          return;
        }

        lastToastedNotificationIdRef.current = latestNotification.id;
        showSnackbar({
          message: latestNotification.title || 'New notification',
          severity: latestNotification.severity === 'CRITICAL' || latestNotification.type === 'ERROR' ? 'error' : latestNotification.severity === 'WARNING' || latestNotification.type === 'WARNING' ? 'warning' : 'info',
        });
      })
      .catch(() => {
        showSnackbar({
          message: 'New notification',
          severity: 'info',
        });
      });
  }, [queryClient, showSnackbar, unreadCount]);
}
