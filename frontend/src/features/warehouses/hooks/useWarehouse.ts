import { useQuery } from '@tanstack/react-query';
import { warehousesApi } from '../api/warehousesApi';

export function useWarehouse(id: number | null) {
  return useQuery({
    queryKey: ['warehouses', 'details', id],
    queryFn: () => warehousesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
