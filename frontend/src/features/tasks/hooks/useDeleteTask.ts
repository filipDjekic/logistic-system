import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { tasksApi } from '../api/tasksApi';

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: async () => {
      showSnackbar({
        message: 'Task deleted successfully.',
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
