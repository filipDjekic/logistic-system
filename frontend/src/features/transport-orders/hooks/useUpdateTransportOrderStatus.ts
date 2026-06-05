import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { transportOrdersApi } from '../api/transportOrdersApi';
import { invalidateTransportOrderState } from '../../../core/utils/invalidateAppState';
import type { TransportOrderStatus } from '../types/transportOrder.types';

type UpdateTransportOrderStatusPayload = {
  id: number;
  status: TransportOrderStatus;
  reason?: string;
  expectedVersion?: number;
};

export function useUpdateTransportOrderStatus() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, status, reason, expectedVersion }: UpdateTransportOrderStatusPayload) =>
      transportOrdersApi.updateStatus(id, status, reason, expectedVersion),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Transport order status updated to ${variables.status}.`,
        severity: 'success',
      });

      await invalidateTransportOrderState(queryClient, variables.id);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}