import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../api/shiftsApi';

export function useShifts(enabled = true) {
  return useQuery({
    queryKey: ['shifts', 'all'],
    queryFn: shiftsApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}