import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ['products', 'details', id],
    queryFn: () => productsApi.getById(id as number),
    enabled: Number.isFinite(id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
