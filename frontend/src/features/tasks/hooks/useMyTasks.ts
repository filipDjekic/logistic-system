import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { tasksApi } from '../api/tasksApi';
import type { TaskQueryParams } from '../types/task.types';

export function useMyTasks(filters?: Omit<TaskQueryParams, 'assignedEmployeeId'> & PageParams, enabled = true) {
  return useQuery({
    queryKey: ['tasks', 'my', filters],
    queryFn: () => tasksApi.getMy(filters),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}