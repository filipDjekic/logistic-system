import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { employeesApi } from '../api/employeesApi';

export function useEmployee(id: number | null) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id as number),
    queryFn: () => employeesApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: cacheTimes.standard,
  });
}
