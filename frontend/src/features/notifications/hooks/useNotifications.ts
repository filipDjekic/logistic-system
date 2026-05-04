import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { GetMyNotificationsParams } from '../types/notification.types';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';
import { NOTIFICATION_POLL_INTERVAL_MS } from '../constants/notificationLive';

export function useNotifications(params: GetMyNotificationsParams = {}) {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const status = params.status || '';
  const type = params.type || '';
  const queryParams = { page, size, status, type };

  return useQuery({
    queryKey: queryKeys.notifications.my(queryParams),
    queryFn: () => notificationsApi.getMyNotifications(queryParams),
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.volatile,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
