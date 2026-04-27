import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi } from '../api/productsApi';
import type { ProductUpdateRequest } from '../types/product.types';

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateRequest }) =>
      productsApi.update(id, data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.root() }),
      ]);
    },
  });
};
