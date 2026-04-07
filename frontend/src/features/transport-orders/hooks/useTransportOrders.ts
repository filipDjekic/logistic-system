import { useQuery } from '@tanstack/react-query';
import { transportOrdersApi } from '../api/transportOrdersApi';

export function useTransportOrders(enabled = true) {
  return useQuery({
    queryKey: ['transport-orders', 'all'],
    queryFn: transportOrdersApi.getAll,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}