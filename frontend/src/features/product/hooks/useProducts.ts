import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi, type ProductSearchParams } from '../api/productsApi';

export const useProducts = (params: ProductSearchParams = {}) => {
  return useQuery({
    queryKey: [...queryKeys.products.all(), params],
    queryFn: () => productsApi.getAll(params),
    staleTime: cacheTimes.reference,
  });
};
