import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { invalidateProductState } from '../../../core/utils/invalidateAppState';

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: async () => {
      await invalidateProductState(queryClient);
    },
  });
};
