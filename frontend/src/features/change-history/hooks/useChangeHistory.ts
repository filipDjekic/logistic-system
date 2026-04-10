import { useQuery } from '@tanstack/react-query';
import { changeHistoryApi } from '../api/changeHistoryApi';

export function useChangeHistory(enabled = true) {
  return useQuery({
    queryKey: ['change-history', 'all'],
    queryFn: changeHistoryApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}