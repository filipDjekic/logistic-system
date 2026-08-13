import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { warehousesApi } from '../api/warehousesApi';
import { isPositiveIntegerId } from '../../../core/utils/routeParams';

export function useWarehouse(id: number | null) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id as number),
    queryFn: () => warehousesApi.getById(id as number),
    enabled: isPositiveIntegerId(id),
    staleTime: cacheTimes.standard,
  });
}
