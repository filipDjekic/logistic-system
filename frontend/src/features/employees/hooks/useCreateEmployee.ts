import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateEmployeeState } from '../../../core/utils/invalidateAppState';
import { employeesApi } from '../api/employeesApi';
import type { EmployeeCreateWithUserRequest } from '../types/employee.types';

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: EmployeeCreateWithUserRequest) => employeesApi.createWithUser(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Employee and user created successfully.',
        severity: 'success',
      });

      await invalidateEmployeeState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}