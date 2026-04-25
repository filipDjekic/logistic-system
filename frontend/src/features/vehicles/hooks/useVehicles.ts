import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { vehiclesApi } from '../api/vehiclesApi';
import type { VehicleSearchParams } from '../types/vehicle.types';

export function useVehicles(params?: VehicleSearchParams & PageParams, enabled = true) {
  return useQuery({
    queryKey: ['vehicles', 'all', params ?? {}],
    queryFn: () => vehiclesApi.getAll(params),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
