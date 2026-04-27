import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { warehousesApi } from '../api/warehousesApi';

export function useWarehouse(id: number | null) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id as number),
    queryFn: () => warehousesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: cacheTimes.standard,
  });
}
