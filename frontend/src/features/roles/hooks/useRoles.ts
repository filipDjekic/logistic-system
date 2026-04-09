import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../api/rolesApi';

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: rolesApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}