import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { countriesApi } from '../api/countriesApi';

export function useCountry(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.countries.detail(id ?? 0),
    queryFn: () => countriesApi.getById(id as number),
    enabled: enabled && Boolean(id),
    staleTime: cacheTimes.reference,
  });
}