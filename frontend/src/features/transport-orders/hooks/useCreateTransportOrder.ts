import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { transportOrdersApi } from '../api/transportOrdersApi';
import { invalidateTransportOrderState } from '../../../core/utils/invalidateAppState';
import type { TransportOrderCreateRequest } from '../types/transportOrder.types';

export function useCreateTransportOrder() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: TransportOrderCreateRequest) => transportOrdersApi.create(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Transport order created successfully.',
        severity: 'success',
      });

      await invalidateTransportOrderState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}