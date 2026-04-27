import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { changeHistoryApi } from '../api/changeHistoryApi';
import type { ChangeHistoryQueryParams } from '../types/changeHistory.types';

export function useChangeHistory(
  params?: ChangeHistoryQueryParams & PageParams,
  enabled = true,
) {
  const entityName = params?.entityName?.trim() || '';
  const entityId = params?.entityId ?? null;
  const userId = params?.userId ?? null;
  const changeType = params?.changeType ?? undefined;
  const search = params?.search?.trim() || '';
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  const sort = params?.sort ?? 'changedAt,desc';
  const normalizedParams = { search, changeType, entityName, entityId, userId, page, size, sort };

  return useQuery({
    queryKey: queryKeys.changeHistory.list(normalizedParams),
    queryFn: () => changeHistoryApi.getAll(normalizedParams),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.volatile,
  });
}
