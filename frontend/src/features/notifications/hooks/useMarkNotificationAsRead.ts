import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() });
    },
  });
}
