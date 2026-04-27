import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { vehiclesApi } from '../api/vehiclesApi';

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id as number),
    queryFn: () => vehiclesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: cacheTimes.standard,
  });
}
