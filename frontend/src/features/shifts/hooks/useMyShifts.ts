import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../api/shiftsApi';

export function useMyShifts(enabled = true) {
  return useQuery({
    queryKey: ['shifts', 'my'],
    queryFn: shiftsApi.getMy,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}