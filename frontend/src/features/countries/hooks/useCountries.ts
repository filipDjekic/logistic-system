import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { countriesApi } from '../api/countriesApi';

export function useCountries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.countries.all(),
    queryFn: countriesApi.getAll,
    enabled,
    staleTime: cacheTimes.reference,
  });
}

export function useActiveCountries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.countries.active(),
    queryFn: countriesApi.getActive,
    enabled,
    staleTime: cacheTimes.reference,
  });
}