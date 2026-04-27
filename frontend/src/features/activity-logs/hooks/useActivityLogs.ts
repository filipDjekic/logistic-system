import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { activityLogsApi } from '../api/activityLogsApi';
import type { ActivityLogQueryParams } from '../types/activityLog.types';

export function useActivityLogs(params?: ActivityLogQueryParams & PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityLogs.list(params ?? {}),
    queryFn: () => activityLogsApi.getAll(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.volatile,
  });
}
