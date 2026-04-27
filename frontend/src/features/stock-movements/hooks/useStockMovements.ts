import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { stockMovementsApi } from '../api/stockMovementsApi';
import type { StockMovementCreateRequest, StockMovementFiltersState } from '../types/stockMovement.types';

export function useStockMovements(filters: StockMovementFiltersState & PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.stockMovements.list(filters),
    queryFn: () => stockMovementsApi.getAll(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.root() }),
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
