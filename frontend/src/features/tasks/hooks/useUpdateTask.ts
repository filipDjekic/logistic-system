import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { tasksApi } from '../api/tasksApi';
import type { TaskUpdateRequest } from '../types/task.types';

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdateRequest }) =>
      tasksApi.update(id, data),
    onSuccess: async () => {
      showSnackbar({
        message: 'Task updated successfully.',
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
