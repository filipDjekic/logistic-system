import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { transportOrdersApi } from '../api/transportOrdersApi';
import type { TransportOrderUpdateRequest } from '../types/transportOrder.types';

export function useUpdateTransportOrder() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: TransportOrderUpdateRequest;
    }) => transportOrdersApi.update(id, payload),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Transport order updated successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transport-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['transport-orders', 'details', variables.id] }),
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
