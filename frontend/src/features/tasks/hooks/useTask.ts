import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { tasksApi } from '../api/tasksApi';
import { isPositiveIntegerId } from '../../../core/utils/routeParams';

export function useTask(id: number | null) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id as number),
    queryFn: () => tasksApi.getById(id as number),
    enabled: isPositiveIntegerId(id),
    staleTime: cacheTimes.volatile,
    refetchOnWindowFocus: false,
  });
}
