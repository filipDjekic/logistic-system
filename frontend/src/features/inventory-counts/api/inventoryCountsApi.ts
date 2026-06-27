import { apiClient } from '../../../core/api/client';
import type { PageResponse } from '../../../core/api/pagination';
import type {
  AllowedStatusTransitionsResponse,
  InventoryCountLineResponse,
  InventoryCountLineStatusFilter,
  InventoryCountLineUpdate,
  InventoryCountSessionCreate,
  InventoryCountSessionResponse,
  InventoryCountSessionSummaryResponse,
} from '../types/inventoryCount.types';

export const inventoryCountsApi = {
  getAll(params?: { warehouseId?: number }) {
    return apiClient.get<InventoryCountSessionSummaryResponse[]>('/api/inventory-counts', { params }).then((response) => response.data);
  },
  getById(id: number) {
    return apiClient.get<InventoryCountSessionResponse>(`/api/inventory-counts/${id}`).then((response) => response.data);
  },
  getLines(id: number, params?: { page?: number; size?: number; sort?: string; search?: string; zoneId?: number; binLocationId?: number; status?: InventoryCountLineStatusFilter | '' }) {
    return apiClient.get<PageResponse<InventoryCountLineResponse>>(`/api/inventory-counts/${id}/lines`, { params }).then((response) => response.data);
  },
  create(payload: InventoryCountSessionCreate) {
    return apiClient.post<InventoryCountSessionResponse>('/api/inventory-counts', payload).then((response) => response.data);
  },
  start(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/start`).then((response) => response.data);
  },
  updateLine(sessionId: number, lineId: number, payload: InventoryCountLineUpdate) {
    return apiClient.patch<InventoryCountSessionResponse>(`/api/inventory-counts/${sessionId}/lines/${lineId}`, payload).then((response) => response.data);
  },
  submitReview(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/submit-review`).then((response) => response.data);
  },
  approve(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/approve`).then((response) => response.data);
  },
  reject(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/reject`).then((response) => response.data);
  },
  createAdjustments(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/create-adjustments`).then((response) => response.data);
  },
  close(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/close`).then((response) => response.data);
  },
  cancel(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/cancel`).then((response) => response.data);
  },
  allowedStatusTransitions(id: number) {
    return apiClient.get<AllowedStatusTransitionsResponse>(`/api/inventory-counts/${id}/allowed-status-transitions`).then((response) => response.data);
  },
};
