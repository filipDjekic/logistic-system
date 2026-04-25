import { useQuery } from '@tanstack/react-query';
import type { PageParams } from '../../../core/api/pagination';
import { transportOrdersApi } from '../api/transportOrdersApi';
import type { TransportOrderListFilters } from '../types/transportOrder.types';

export function useTransportOrders(filters: TransportOrderListFilters & PageParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['transport-orders', 'list', filters],
    queryFn: () => transportOrdersApi.getAll(filters),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
