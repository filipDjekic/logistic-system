import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { rolesApi } from '../api/rolesApi';

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: rolesApi.getAll,
    enabled,
    staleTime: cacheTimes.reference,
  });
}
