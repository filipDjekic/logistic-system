import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};