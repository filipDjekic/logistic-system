import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { warehousesApi } from '../api/warehousesApi';
import type {
  WarehouseCreateRequest,
  WarehouseUpdateRequest,
} from '../types/warehouse.types';

export function useWarehouses(enabled = true) {
  return useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: warehousesApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useWarehouseManagers(enabled = true) {
  return useQuery({
    queryKey: ['warehouses', 'managers'],
    queryFn: warehousesApi.getManagers,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['warehouses', 'details', variables.id] }),
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
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