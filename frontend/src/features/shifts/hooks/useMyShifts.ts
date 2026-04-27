import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { shiftsApi } from '../api/shiftsApi';

export function useMyShifts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.shifts.my(),
    queryFn: shiftsApi.getMy,
    enabled,
    staleTime: cacheTimes.standard,
  });
}
