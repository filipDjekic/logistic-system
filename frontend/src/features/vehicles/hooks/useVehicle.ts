import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { vehiclesApi } from '../api/vehiclesApi';
import { isPositiveIntegerId } from '../../../core/utils/routeParams';

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id as number),
    queryFn: () => vehiclesApi.getById(id as number),
    enabled: isPositiveIntegerId(id),
    staleTime: cacheTimes.volatile,
    refetchOnWindowFocus: false,
  });
}
