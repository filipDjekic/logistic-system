import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasksApi';

export function useMyTasks(enabled = true) {
  return useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: tasksApi.getMy,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}