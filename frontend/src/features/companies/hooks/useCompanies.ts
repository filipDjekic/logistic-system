import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { companiesApi } from '../api/companiesApi';

export function useCompanies(enabled = true) {
  return useQuery({
    queryKey: queryKeys.companies.all(),
    queryFn: companiesApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}