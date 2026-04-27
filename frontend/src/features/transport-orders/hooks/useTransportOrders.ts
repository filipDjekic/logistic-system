import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { transportOrdersApi } from '../api/transportOrdersApi';
import type { TransportOrderListFilters } from '../types/transportOrder.types';

export function useTransportOrders(filters: TransportOrderListFilters & PageParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.transportOrders.list(filters),
    queryFn: () => transportOrdersApi.getAll(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: cacheTimes.standard,
  });
}
