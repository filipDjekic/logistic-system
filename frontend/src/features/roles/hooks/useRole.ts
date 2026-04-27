import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { rolesApi } from '../api/rolesApi';

export function useRole(id: number | null) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id as number),
    queryFn: () => rolesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: cacheTimes.reference,
  });
}
