import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { shiftsApi } from '../api/shiftsApi';

export function useShifts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.shifts.all(),
    queryFn: shiftsApi.getAll,
    enabled,
    staleTime: cacheTimes.standard,
  });
}
