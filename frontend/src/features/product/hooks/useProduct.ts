import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { productsApi } from '../api/productsApi';
import { isPositiveIntegerId } from '../../../core/utils/routeParams';

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: queryKeys.products.detail(id as number),
    queryFn: () => productsApi.getById(id as number),
    enabled: isPositiveIntegerId(id),
    staleTime: cacheTimes.standard,
  });
}
