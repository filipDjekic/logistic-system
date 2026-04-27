import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.myUnreadCount(),
    queryFn: notificationsApi.getMyUnreadCount,
    staleTime: cacheTimes.volatile,
  });
}
