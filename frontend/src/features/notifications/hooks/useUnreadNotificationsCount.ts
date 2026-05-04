import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';
import { NOTIFICATION_POLL_INTERVAL_MS } from '../constants/notificationLive';

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.myUnreadCount(),
    queryFn: notificationsApi.getMyUnreadCount,
    staleTime: cacheTimes.volatile,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
