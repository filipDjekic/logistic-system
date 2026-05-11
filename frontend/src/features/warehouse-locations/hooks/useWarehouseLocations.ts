import { useQuery } from '@tanstack/react-query';
import { warehouseLocationsApi } from '../api/warehouseLocationsApi';

export function useWarehouseZones(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['warehouse-locations', 'zones', params], queryFn: () => warehouseLocationsApi.zones(params), staleTime: 30_000 });
}
export function useBinLocations(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['warehouse-locations', 'bins', params], queryFn: () => warehouseLocationsApi.bins(params), staleTime: 30_000 });
}
export function useBinInventory(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['warehouse-locations', 'bin-inventory', params], queryFn: () => warehouseLocationsApi.binInventory(params), staleTime: 30_000 });
}
export function useInternalWarehouseMovements(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['warehouse-locations', 'internal-movements', params], queryFn: () => warehouseLocationsApi.internalMovements(params), staleTime: 20_000 });
}
