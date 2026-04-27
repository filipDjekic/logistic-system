import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi } from '../api/productsApi';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.root() }),
      ]);
    },
  });
};
