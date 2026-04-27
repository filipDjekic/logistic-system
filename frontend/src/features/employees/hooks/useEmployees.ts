import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { employeesApi } from '../api/employeesApi';
import type { EmployeeListFilters } from '../types/employee.types';

export function useEmployees(filters: EmployeeListFilters & PageParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: () => employeesApi.getAll(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
