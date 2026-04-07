import { useQuery } from '@tanstack/react-query';
import { transportOrdersApi } from '../api/transportOrdersApi';

export function useTransportOrder(id: number | null) {
  return useQuery({
    queryKey: ['transport-orders', 'details', id],
    queryFn: () => transportOrdersApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}