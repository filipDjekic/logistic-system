import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: usersApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}