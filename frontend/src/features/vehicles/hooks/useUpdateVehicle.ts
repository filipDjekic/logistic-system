import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { vehiclesApi } from '../api/vehiclesApi';
import { invalidateVehicleState } from '../../../core/utils/invalidateAppState';
import type { VehicleUpdateRequest } from '../types/vehicle.types';

type UpdateVehiclePayload = {
  id: number;
  data: VehicleUpdateRequest;
};

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: UpdateVehiclePayload) => vehiclesApi.update(id, data),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Vehicle updated successfully.',
        severity: 'success',
      });

      await invalidateVehicleState(queryClient, variables.id);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}