import { useQuery } from '@tanstack/react-query';
import { warehouseLocationsApi } from '../api/warehouseLocationsApi';

export function useWarehouseZones(params: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: ['warehouse-locations', 'zones', params],
    queryFn: () => warehouseLocationsApi.zones(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useBinLocations(params: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: ['warehouse-locations', 'bins', params],
    queryFn: () => warehouseLocationsApi.bins(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useBinInventory(params: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: ['warehouse-locations', 'bin-inventory', params],
    queryFn: () => warehouseLocationsApi.binInventory(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useInternalWarehouseMovements(params: Record<string, unknown> = {}, enabled = true) {
  return useQuery({
    queryKey: ['warehouse-locations', 'internal-movements', params],
    queryFn: () => warehouseLocationsApi.internalMovements(params),
    enabled,
    staleTime: 20_000,
  });
}

export function useWarehouseZone(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['warehouse-locations', 'zone', id],
    queryFn: () => warehouseLocationsApi.getZone(Number(id)),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useBinLocation(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['warehouse-locations', 'bin', id],
    queryFn: () => warehouseLocationsApi.getBin(Number(id)),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}
