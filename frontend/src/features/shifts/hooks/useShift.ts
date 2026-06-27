import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { shiftsApi } from '../api/shiftsApi';

export function useShift(id: number | null, enabled = true) {
  return useQuery({
    queryKey: id ? queryKeys.shifts.detail(id) : queryKeys.shifts.detail(0),
    queryFn: () => shiftsApi.getById(Number(id)),
    enabled: enabled && Number.isInteger(id) && Number(id) > 0,
    staleTime: cacheTimes.standard,
    refetchOnWindowFocus: false,
  });
}
