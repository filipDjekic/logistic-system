import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';

type UseNotificationsParams = {
  page?: number;
  size?: number;
};

export function useNotifications(params: UseNotificationsParams = {}) {
  const page = params.page ?? 0;
  const size = params.size ?? 20;

  return useQuery({
    queryKey: ['notifications', 'my', page, size],
    queryFn: () => notificationsApi.getMyNotifications({ page, size }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}