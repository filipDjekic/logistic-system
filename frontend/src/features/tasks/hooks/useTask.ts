import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { tasksApi } from '../api/tasksApi';

export function useTask(id: number | null) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id as number),
    queryFn: () => tasksApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: cacheTimes.standard,
  });
}
