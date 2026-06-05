import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cacheTimes, garbageCollectionTimes } from '../../../core/constants/cache';
import { lookupApi } from '../api/lookupApi';
import type { LookupEntityType, LookupParams } from '../types/lookup.types';

export function useEntityLookup(entityType: LookupEntityType, params: LookupParams = {}, enabled = true) {
  const normalizedParams: LookupParams = {
    ...params,
    page: params.page ?? 0,
    size: Math.min(Math.max(params.size ?? 10, 1), 50),
    search: params.search?.trim() || undefined,
  };

  return useQuery({
    queryKey: ['lookup', entityType, normalizedParams],
    queryFn: () => lookupApi.getOptions(entityType, normalizedParams),
    enabled,
    staleTime: cacheTimes.reference,
    gcTime: garbageCollectionTimes.reference,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
