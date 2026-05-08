import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { companyRegistrationApi } from '../api/companyRegistrationApi';
import type { CompanyRegistrationStatus } from '../types/companyRegistration.types';

export function useCompanyRegistrationRequests(status?: CompanyRegistrationStatus | '') {
  return useQuery({
    queryKey: queryKeys.companyRegistrationRequests.list(status ?? ''),
    queryFn: () => companyRegistrationApi.getAll(status),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}
