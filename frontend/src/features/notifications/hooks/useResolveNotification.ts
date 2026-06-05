import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { notificationsApi } from '../api/notificationsApi';

export function useResolveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.resolve,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() });
    },
  });
}
