import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { transportOrdersApi } from '../api/transportOrdersApi';
import type { TransportOrderStatus } from '../types/transportOrder.types';

type UpdateTransportOrderStatusPayload = {
  id: number;
  status: TransportOrderStatus;
};

export function useUpdateTransportOrderStatus() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, status }: UpdateTransportOrderStatusPayload) =>
      transportOrdersApi.updateStatus(id, status),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Transport order status updated to ${variables.status}.`,
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transport-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['transport-order-items'] }),
      ]);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}