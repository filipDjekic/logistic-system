import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { employeeProfileChangeRequestsApi } from '../api/employeeProfileChangeRequestsApi';
import type { GetEmployeeProfileChangeRequestsParams } from '../types/employeeProfileChangeRequest.types';

export function useEmployeeProfileChangeRequests(params: GetEmployeeProfileChangeRequestsParams = {}) {
  const queryParams: GetEmployeeProfileChangeRequestsParams = {
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'createdAt,desc',
    status: params.status ?? '',
  };

  return useQuery({
    queryKey: queryKeys.employeeProfileChangeRequests.list(queryParams),
    queryFn: () => employeeProfileChangeRequestsApi.getAll(queryParams),
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
