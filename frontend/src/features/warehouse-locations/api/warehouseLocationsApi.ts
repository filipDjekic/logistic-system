import { apiClient } from '../../../core/api/client';
import type {
  BinInventoryCreate,
  BinInventoryResponse,
  BinLocationCreate,
  BinLocationResponse,
  BinLocationUpdate,
  InternalWarehouseMovementCreate,
  InternalWarehouseMovementResponse,
  PageResponse,
  WarehouseZoneCreate,
  WarehouseZoneResponse,
  WarehouseZoneUpdate,
} from '../types/warehouseLocation.types';

export const warehouseLocationsApi = {
  zones(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<WarehouseZoneResponse>>('/api/warehouse-locations/zones', { params }).then((r) => r.data);
  },
  createZone(payload: WarehouseZoneCreate) {
    return apiClient.post<WarehouseZoneResponse>('/api/warehouse-locations/zones', payload).then((r) => r.data);
  },
  updateZone(id: number, payload: WarehouseZoneUpdate) {
    return apiClient.put<WarehouseZoneResponse>(`/api/warehouse-locations/zones/${id}`, payload).then((r) => r.data);
  },
  getZone(id: number) {
    return apiClient.get<WarehouseZoneResponse>(`/api/warehouse-locations/zones/${id}`).then((r) => r.data);
  },
  bins(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<BinLocationResponse>>('/api/warehouse-locations/bins', { params }).then((r) => r.data);
  },
  createBin(payload: BinLocationCreate) {
    return apiClient.post<BinLocationResponse>('/api/warehouse-locations/bins', payload).then((r) => r.data);
  },
  updateBin(id: number, payload: BinLocationUpdate) {
    return apiClient.put<BinLocationResponse>(`/api/warehouse-locations/bins/${id}`, payload).then((r) => r.data);
  },
  getBin(id: number) {
    return apiClient.get<BinLocationResponse>(`/api/warehouse-locations/bins/${id}`).then((r) => r.data);
  },
  binInventory(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<BinInventoryResponse>>('/api/warehouse-locations/bin-inventory', { params }).then((r) => r.data);
  },
  setBinInventory(payload: BinInventoryCreate) {
    return apiClient.post<BinInventoryResponse>('/api/warehouse-locations/bin-inventory', payload).then((r) => r.data);
  },
  internalMovements(params?: Record<string, unknown>) {
    return apiClient.get<PageResponse<InternalWarehouseMovementResponse>>('/api/warehouse-locations/internal-movements', { params }).then((r) => r.data);
  },
  moveInternal(payload: InternalWarehouseMovementCreate) {
    return apiClient.post<InternalWarehouseMovementResponse>('/api/warehouse-locations/internal-movements', payload).then((r) => r.data);
  },
};
