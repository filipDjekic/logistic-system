import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { profileApi } from '../api/profileApi';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: profileApi.getCurrent,
    staleTime: cacheTimes.standard,
  });
}
