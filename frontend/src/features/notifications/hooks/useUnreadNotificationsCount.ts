import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'my', 'unread-count'],
    queryFn: notificationsApi.getMyUnreadCount,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}