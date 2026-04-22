import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { vehiclesApi } from '../api/vehiclesApi';

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (id: number) => vehiclesApi.delete(id),
    onSuccess: async () => {
      showSnackbar({
        message: 'Vehicle deleted successfully.',
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