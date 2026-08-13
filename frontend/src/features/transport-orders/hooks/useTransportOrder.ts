import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { transportOrdersApi } from '../api/transportOrdersApi';
import { isPositiveIntegerId } from '../../../core/utils/routeParams';

export function useTransportOrder(id: number | null) {
  return useQuery({
    queryKey: queryKeys.transportOrders.detail(id as number),
    queryFn: () => transportOrdersApi.getById(id as number),
    enabled: isPositiveIntegerId(id),
    staleTime: cacheTimes.volatile,
    refetchOnWindowFocus: false,
  });
}
