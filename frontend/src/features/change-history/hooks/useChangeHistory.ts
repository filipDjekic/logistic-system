import { useQuery } from '@tanstack/react-query';
import { changeHistoryApi } from '../api/changeHistoryApi';
import type { ChangeHistoryQueryParams } from '../types/changeHistory.types';

export function useChangeHistory(
  params?: ChangeHistoryQueryParams,
  enabled = true,
) {
  const entityName = params?.entityName?.trim() || '';
  const entityId = params?.entityId ?? null;
  const userId = params?.userId ?? null;

  return useQuery({
    queryKey: ['change-history', { entityName, entityId, userId }],
    queryFn: () =>
      changeHistoryApi.getContext({
        entityName,
        entityId,
        userId,
      }),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}