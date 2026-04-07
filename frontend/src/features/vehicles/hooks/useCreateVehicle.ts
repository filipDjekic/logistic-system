import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { vehiclesApi } from '../api/vehiclesApi';
import type { VehicleCreateRequest } from '../types/vehicle.types';

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: VehicleCreateRequest) => vehiclesApi.create(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Vehicle created successfully.',
        severity: 'success',
      });

      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}