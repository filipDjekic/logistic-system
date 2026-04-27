import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { vehiclesApi } from '../api/vehiclesApi';
import type { VehicleSearchParams } from '../types/vehicle.types';

export function useVehicles(params?: VehicleSearchParams & PageParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vehicles.all(params ?? {}),
    queryFn: () => vehiclesApi.getAll(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
