import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { employeesApi } from '../api/employeesApi';
import type { EmployeeListFilters } from '../types/employee.types';

export function useEmployees(filters: EmployeeListFilters & PageParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['employees', 'list', filters],
    queryFn: () => employeesApi.getAll(filters),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
