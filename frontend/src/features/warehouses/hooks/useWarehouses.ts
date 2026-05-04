import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateWarehouseState } from '../../../core/utils/invalidateAppState';
import { warehousesApi } from '../api/warehousesApi';
import type {
  WarehouseCreateRequest,
  WarehouseFilterParams,
  WarehouseUpdateRequest,
} from '../types/warehouse.types';

export function useWarehouses(filters: WarehouseFilterParams & PageParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.warehouses.all(filters),
    queryFn: () => warehousesApi.getAll(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}

export function useWarehouseManagers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.warehouses.managers(),
    queryFn: warehousesApi.getManagers,
    enabled,
    staleTime: cacheTimes.reference,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: WarehouseCreateRequest) => warehousesApi.create(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Warehouse created successfully.',
        severity: 'success',
      });

      await invalidateWarehouseState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WarehouseUpdateRequest }) =>
      warehousesApi.update(id, data),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Warehouse updated successfully.',
        severity: 'success',
      });

      await invalidateWarehouseState(queryClient, variables.id);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (id: number) => warehousesApi.delete(id),
    onSuccess: async () => {
      showSnackbar({
        message: 'Warehouse deleted successfully.',
        severity: 'success',
      });

      await invalidateWarehouseState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}
