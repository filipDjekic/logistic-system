import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';
import { isPositiveIntegerId } from '../../../core/utils/routeParams';

export function useUser(id: number | null) {
  return useQuery({
    queryKey: ['users', 'details', id],
    queryFn: () => usersApi.getById(id as number),
    enabled: isPositiveIntegerId(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
