import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { tasksApi } from '../api/tasksApi';
import type { TaskQueryParams } from '../types/task.types';

export function useTasks(filters?: TaskQueryParams & PageParams, enabled = true) {
  return useQuery({
    queryKey: ['tasks', 'all', filters],
    queryFn: () => tasksApi.getAll(filters),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}