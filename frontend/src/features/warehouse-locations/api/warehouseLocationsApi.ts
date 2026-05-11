import { apiClient } from '../../../core/api/client';
import type { BinInventoryResponse, BinLocationResponse, InternalWarehouseMovementResponse, PageResponse, WarehouseZoneResponse } from '../types/warehouseLocation.types';

export const warehouseLocationsApi = {
  zones(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<WarehouseZoneResponse>>('/api/warehouse-locations/zones', { params }).then((r) => r.data);
  },
  bins(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<BinLocationResponse>>('/api/warehouse-locations/bins', { params }).then((r) => r.data);
  },
  binInventory(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<BinInventoryResponse>>('/api/warehouse-locations/bin-inventory', { params }).then((r) => r.data);
  },
  internalMovements(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<InternalWarehouseMovementResponse>>('/api/warehouse-locations/internal-movements', { params }).then((r) => r.data);
  },
};
