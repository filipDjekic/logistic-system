import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: ['vehicles', 'details', id],
    queryFn: () => vehiclesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}