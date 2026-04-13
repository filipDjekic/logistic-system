import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import type { ProductUpdateRequest } from '../types/product.types';

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdateRequest }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};