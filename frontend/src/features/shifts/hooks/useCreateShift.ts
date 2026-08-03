import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateShiftState } from '../../../core/utils/invalidateAppState';
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
    }
  | {
      mode: 'cancel';
      id: number;
    }
  | {
      mode: 'cancel-sickness';
      id: number;
      reason: string;
    };

export function useCreateShift() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: async (payload: SaveShiftPayload): Promise<void> => {
      if (payload.mode === 'create') {
        await shiftsApi.create(payload.data);
        return;
      }

      if (payload.mode === 'cancel') {
        await shiftsApi.cancel(payload.id);
        return;
      }

      if (payload.mode === 'cancel-sickness') {
        await shiftsApi.cancelDueToSickness(payload.id, payload.reason);
        return;
      }

      await shiftsApi.update(payload.id, payload.data);
    },
    onSuccess: async (_, variables) => {
      showSnackbar({
        message:
          variables.mode === 'create'
            ? 'Shift created successfully.'
            : variables.mode === 'cancel' || variables.mode === 'cancel-sickness'
              ? 'Shift cancelled successfully.'
              : 'Shift updated successfully.',
        severity: 'success',
      });

      await invalidateShiftState(queryClient, variables.mode === 'create' ? undefined : variables.id);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}
