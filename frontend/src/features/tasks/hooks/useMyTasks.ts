import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { tasksApi } from '../api/tasksApi';
import type { TaskQueryParams } from '../types/task.types';

export function useMyTasks(filters?: Omit<TaskQueryParams, 'assignedEmployeeId'> & PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.my(filters ?? {}),
    queryFn: () => tasksApi.getMy(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
