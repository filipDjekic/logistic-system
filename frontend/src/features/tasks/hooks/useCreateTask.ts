import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { tasksApi } from '../api/tasksApi';
import { invalidateTaskState } from '../../../core/utils/invalidateAppState';
import type { TaskCreateRequest } from '../types/task.types';

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: TaskCreateRequest) => tasksApi.create(payload),
    onSuccess: async () => {
      showSnackbar({
        message: 'Task created successfully.',
        severity: 'success',
      });

      await invalidateTaskState(queryClient);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}