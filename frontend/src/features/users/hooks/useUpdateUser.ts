import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateUserState } from '../../../core/utils/invalidateAppState';
import { usersApi } from '../api/usersApi';
import type { UserUpdateRequest } from '../types/user.types';

type UpdateUserPayload = {
  id: number;
  data: UserUpdateRequest;
};

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: UpdateUserPayload) => usersApi.update(id, data),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'User updated successfully.',
        severity: 'success',
      });

      await invalidateUserState(queryClient, variables.id);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}