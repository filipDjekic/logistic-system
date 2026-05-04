import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateEmployeeState } from '../../../core/utils/invalidateAppState';
import { employeesApi } from '../api/employeesApi';
import type { EmployeeUpdateRequest } from '../types/employee.types';

type UpdateEmployeePayload = {
  id: number;
  data: EmployeeUpdateRequest;
};

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: UpdateEmployeePayload) => employeesApi.update(id, data),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Employee updated successfully.',
        severity: 'success',
      });

      await invalidateEmployeeState(queryClient, variables.id);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}