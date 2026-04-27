import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { tasksApi } from '../api/tasksApi';
import type { TaskQueryParams } from '../types/task.types';

export function useTasks(filters?: TaskQueryParams & PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.all(filters ?? {}),
    queryFn: () => tasksApi.getAll(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
