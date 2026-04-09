import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';

export function useUser(id: number | null) {
  return useQuery({
    queryKey: ['users', 'details', id],
    queryFn: () => usersApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}