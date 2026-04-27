import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi } from '../api/productsApi';

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.root() }),
      ]);
    },
  });
};
