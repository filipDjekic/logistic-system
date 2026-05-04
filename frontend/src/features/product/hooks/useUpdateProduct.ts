import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { invalidateProductState } from '../../../core/utils/invalidateAppState';
import type { ProductUpdateRequest } from '../types/product.types';

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateRequest }) =>
      productsApi.update({id, data}),
    onSuccess: async (_, variables) => {
      await invalidateProductState(queryClient, variables.id);
    },
  });
};
