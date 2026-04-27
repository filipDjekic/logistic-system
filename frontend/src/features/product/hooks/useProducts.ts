import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi } from '../api/productsApi';

export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.products.all(),
    queryFn: productsApi.getAll,
    staleTime: cacheTimes.reference,
  });
};
