import { useQuery } from '@tanstack/react-query';
import { activityLogsApi } from '../api/activityLogsApi';

export function useActivityLogs(enabled = true) {
  return useQuery({
    queryKey: ['activity-logs', 'all'],
    queryFn: activityLogsApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}