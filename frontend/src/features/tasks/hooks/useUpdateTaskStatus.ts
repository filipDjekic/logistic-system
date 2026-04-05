import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { tasksApi } from '../api/tasksApi';
import type { TaskStatus } from '../types/task.types';

type UpdateTaskStatusPayload = {
  id: number;
  status: TaskStatus;
};

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, status }: UpdateTaskStatusPayload) =>
      tasksApi.updateStatus(id, status),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Task status updated to ${variables.status}.`,
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'my-tasks'] }),
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