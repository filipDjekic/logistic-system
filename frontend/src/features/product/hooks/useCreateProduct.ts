import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { invalidateProductState } from '../../../core/utils/invalidateAppState';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: async () => {
      await invalidateProductState(queryClient);
    },
  });
};
