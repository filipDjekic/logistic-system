import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { shiftsApi } from '../api/shiftsApi';

export function useShifts(params?: PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.shifts.list(params),
    queryFn: () => shiftsApi.getAll(params),
    enabled,
    staleTime: cacheTimes.standard,
  });
}
