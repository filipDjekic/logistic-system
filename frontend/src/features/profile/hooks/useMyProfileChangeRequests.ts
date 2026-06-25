import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { profileApi } from '../api/profileApi';
import type { GetMyProfileChangeRequestsParams } from '../types/profileChangeRequest.types';

export function useMyProfileChangeRequests(params: GetMyProfileChangeRequestsParams = {}, enabled = true) {
  const queryParams: GetMyProfileChangeRequestsParams = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'createdAt,desc',
  };

  return useQuery({
    queryKey: queryKeys.profile.changeRequests(queryParams),
    queryFn: () => profileApi.getMyChangeRequests(queryParams),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
