import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';

export function useVehicles(enabled = true) {
  return useQuery({
    queryKey: ['vehicles', 'all'],
    queryFn: vehiclesApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}