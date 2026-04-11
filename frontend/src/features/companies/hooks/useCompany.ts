import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { companiesApi } from '../api/companiesApi';

export function useCompany(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => companiesApi.getById(id),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}