import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};