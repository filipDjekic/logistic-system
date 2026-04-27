import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi } from '../api/productsApi';

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: queryKeys.products.detail(id as number),
    queryFn: () => productsApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: cacheTimes.standard,
  });
}
