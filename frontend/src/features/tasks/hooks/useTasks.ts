import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasksApi';

export function useTasks(enabled = true) {
  return useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: tasksApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}