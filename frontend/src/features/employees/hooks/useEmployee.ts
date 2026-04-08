import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../api/employeesApi';

export function useEmployee(id: number | null) {
  return useQuery({
    queryKey: ['employees', 'details', id],
    queryFn: () => employeesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}