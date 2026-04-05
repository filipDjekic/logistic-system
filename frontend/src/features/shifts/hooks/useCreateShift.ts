import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { shiftsApi } from '../api/shiftsApi';
import type { ShiftCreateRequest, ShiftUpdateRequest } from '../types/shift.types';

type SaveShiftPayload =
  | {
      mode: 'create';
      data: ShiftCreateRequest;
    }
  | {
      mode: 'edit';
      id: number;
      data: ShiftUpdateRequest;
    };

export function useCreateShift() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: SaveShiftPayload) => {
      if (payload.mode === 'create') {
        return shiftsApi.create(payload.data);
      }

      return shiftsApi.update(payload.id, payload.data);
    },
    onSuccess: async (_, variables) => {
      showSnackbar({
        message:
          variables.mode === 'create'
            ? 'Shift created successfully.'
            : 'Shift updated successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shifts'] }),
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