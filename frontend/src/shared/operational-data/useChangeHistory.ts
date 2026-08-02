import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams, PageResponse } from '../../core/api/pagination';
import { apiClient } from '../../core/api/client';
import { cacheTimes } from '../../core/constants/cache';
import { queryKeys } from '../../core/constants/queryKeys';
import type { ChangeHistoryQueryParams, ChangeHistoryResponse } from './types';

export function useChangeHistory(params?: ChangeHistoryQueryParams & PageParams, enabled = true) {
  const normalizedParams = {
    search: params?.search?.trim() || '',
    changeType: params?.changeType,
    entityName: params?.entityName?.trim() || '',
    entityId: params?.entityId ?? null,
    userId: params?.userId ?? null,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
    sort: params?.sort ?? 'changedAt,desc',
  };
  return useQuery({
    queryKey: queryKeys.changeHistory.list(normalizedParams),
    queryFn: () => apiClient.get<PageResponse<ChangeHistoryResponse>>('/api/history', { params: normalizedParams }).then((response) => response.data),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.volatile,
  });
}
