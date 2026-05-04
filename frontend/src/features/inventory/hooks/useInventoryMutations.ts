import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateInventoryState } from '../../../core/utils/invalidateAppState';
import { inventoryApi } from '../api/inventoryApi';
import type {
  WarehouseInventoryCreateRequest,
  WarehouseInventoryUpdateRequest,
} from '../types/inventory.types';

export function useCreateInventoryRecord() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: WarehouseInventoryCreateRequest) =>
      inventoryApi.createInventoryRecord(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Inventory record created successfully.',
        severity: 'success',
      });

      await invalidateInventoryState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}

export function useUpdateInventoryRecord() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({
      warehouseId,
      productId,
      data,
    }: {
      warehouseId: number;
      productId: number;
      data: WarehouseInventoryUpdateRequest;
    }) => inventoryApi.updateInventoryRecord(warehouseId, productId, data),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Inventory record updated successfully.',
        severity: 'success',
      });

      await invalidateInventoryState(queryClient, variables.warehouseId, variables.productId);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}

export function useDeleteInventoryRecord() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ warehouseId, productId }: { warehouseId: number; productId: number }) =>
      inventoryApi.deleteInventoryRecord(warehouseId, productId),
    onSuccess: async () => {
      showSnackbar({
        message: 'Inventory record deleted successfully.',
        severity: 'success',
      });

      await invalidateInventoryState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}