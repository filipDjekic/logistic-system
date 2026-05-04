import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateInventoryState } from '../../../core/utils/invalidateAppState';
import { stockMovementsApi } from '../api/stockMovementsApi';
import type {
  StockAdjustmentRequest,
  StockInboundRequest,
  StockMovementFiltersState,
  StockOutboundRequest,
  StockReturnRequest,
  StockTransferRequest,
  StockWriteOffRequest,
} from '../types/stockMovement.types';

export function useStockMovements(filters: StockMovementFiltersState & PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.stockMovements.list(filters),
    queryFn: () => stockMovementsApi.getAll(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}

type StockOperationMutationPayload =
  | { type: 'inbound'; payload: StockInboundRequest }
  | { type: 'outbound'; payload: StockOutboundRequest }
  | { type: 'transfer'; payload: StockTransferRequest }
  | { type: 'adjustment'; payload: StockAdjustmentRequest }
  | { type: 'write-off'; payload: StockWriteOffRequest }
  | { type: 'return'; payload: StockReturnRequest };

export function useCreateStockOperation() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (request: StockOperationMutationPayload) => {
      switch (request.type) {
        case 'inbound':
          return stockMovementsApi.inbound(request.payload);
        case 'outbound':
          return stockMovementsApi.outbound(request.payload);
        case 'transfer':
          return stockMovementsApi.transfer(request.payload);
        case 'adjustment':
          return stockMovementsApi.adjustment(request.payload);
        case 'write-off':
          return stockMovementsApi.writeOff(request.payload);
        case 'return':
          return stockMovementsApi.returnStock(request.payload);
        default: {
          const exhaustiveCheck: never = request;
          throw new Error(`Unsupported stock operation: ${String(exhaustiveCheck)}`);
        }
      }
    },
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Stock operation completed successfully.',
        severity: 'success',
      });

      if (variables.type === 'transfer') {
        await Promise.all([
          invalidateInventoryState(
            queryClient,
            variables.payload.sourceWarehouseId,
            variables.payload.productId,
          ),
          invalidateInventoryState(
            queryClient,
            variables.payload.destinationWarehouseId,
            variables.payload.productId,
          ),
        ]);
        return;
      }

      await invalidateInventoryState(
        queryClient,
        variables.payload.warehouseId,
        variables.payload.productId,
      );
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}
