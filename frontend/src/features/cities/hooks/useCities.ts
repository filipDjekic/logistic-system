import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { citiesApi } from '../api/citiesApi';

export function useCities(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cities.all(),
    queryFn: () => citiesApi.getAll(true),
    enabled,
    staleTime: cacheTimes.reference,
  });
}

export function useCitiesByCountry(countryId?: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.cities.byCountry(countryId ?? null),
    queryFn: () => citiesApi.getByCountry(Number(countryId)),
    enabled: enabled && Boolean(countryId),
    staleTime: cacheTimes.reference,
  });
}
