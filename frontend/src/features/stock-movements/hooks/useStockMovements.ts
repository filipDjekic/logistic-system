import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { stockMovementsApi } from '../api/stockMovementsApi';
import type { StockMovementCreateRequest } from '../types/stockMovement.types';

export function useStockMovements(enabled = true) {
  return useQuery({
    queryKey: ['stock-movements', 'all'],
    queryFn: stockMovementsApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: StockMovementCreateRequest) =>
      stockMovementsApi.create(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Stock movement created successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
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