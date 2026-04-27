import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { GetMyNotificationsParams } from '../types/notification.types';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';

export function useNotifications(params: GetMyNotificationsParams = {}) {
  const page = params.page ?? 0;
  const size = params.size ?? 20;

  return useQuery({
    queryKey: queryKeys.notifications.my(page, size),
    queryFn: () => notificationsApi.getMyNotifications({ page, size }),
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.volatile,
  });
}
