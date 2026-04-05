import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasksApi';

export function useTask(id: number | null) {
  return useQuery({
    queryKey: ['tasks', 'details', id],
    queryFn: () => tasksApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}