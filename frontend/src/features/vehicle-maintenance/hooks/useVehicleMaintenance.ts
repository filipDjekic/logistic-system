import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { queryKeys } from '../../../core/constants/queryKeys';
import { vehicleMaintenanceApi } from '../api/vehicleMaintenanceApi';
import type { VehicleMaintenanceFilters } from '../types/vehicleMaintenance.types';

export function useVehicleMaintenance(params?: VehicleMaintenanceFilters & PageParams) {
  return useQuery({
    queryKey: queryKeys.vehicleMaintenance.list(params ?? {}),
    queryFn: () => vehicleMaintenanceApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
