import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../api/rolesApi';

export function useRole(id: number | null) {
  return useQuery({
    queryKey: ['roles', 'details', id],
    queryFn: () => rolesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
