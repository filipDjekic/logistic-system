import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { profileApi } from '../api/profileApi';
import type { EmployeeProfileChangeRequestCreate } from '../types/profileChangeRequest.types';

export function useCreateProfileChangeRequest() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: EmployeeProfileChangeRequestCreate) => profileApi.createMyChangeRequest(payload),
    onSuccess: async () => {
      showSnackbar({ message: 'Profile change request submitted.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() });
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });
}
