import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { vehicleMaintenanceApi } from '../api/vehicleMaintenanceApi';
import type { VehicleMaintenanceCreateRequest, VehicleMaintenanceUpdateRequest } from '../types/vehicleMaintenance.types';

export function useCreateVehicleMaintenance() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: VehicleMaintenanceCreateRequest) => vehicleMaintenanceApi.create(payload),
    onSuccess: async () => {
      showSnackbar({ message: 'Vehicle maintenance scheduled.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicleMaintenance.root() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}

export function useUpdateVehicleMaintenance() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VehicleMaintenanceUpdateRequest }) => vehicleMaintenanceApi.update(id, payload),
    onSuccess: async () => {
      showSnackbar({ message: 'Vehicle maintenance updated.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicleMaintenance.root() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}

export function useVehicleMaintenanceAction() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: 'start' | 'complete' | 'cancel'; reason?: string }) => {
      if (action === 'start') return vehicleMaintenanceApi.start(id);
      if (action === 'complete') return vehicleMaintenanceApi.complete(id);
      return vehicleMaintenanceApi.cancel(id, reason);
    },
    onSuccess: async () => {
      showSnackbar({ message: 'Vehicle maintenance updated.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicleMaintenance.root() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}
