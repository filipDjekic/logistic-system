import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../api/employeesApi';

export function useEmployees(enabled = true) {
  return useQuery({
    queryKey: ['employees', 'all'],
    queryFn: employeesApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}