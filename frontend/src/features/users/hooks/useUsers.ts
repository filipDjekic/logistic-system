import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { usersApi } from '../api/usersApi';

export function useUsers(params?: PageParams, enabled = true) {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => usersApi.getAll(params),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}