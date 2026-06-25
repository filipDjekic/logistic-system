import { apiClient } from '../../../core/api/client';
import type { InventoryCountLineUpdate, InventoryCountSessionCreate, InventoryCountSessionResponse } from '../types/inventoryCount.types';

export const inventoryCountsApi = {
  getAll(params?: { warehouseId?: number }) {
    return apiClient.get<InventoryCountSessionResponse[]>('/api/inventory-counts', { params }).then((response) => response.data);
  },
  getById(id: number) {
    return apiClient.get<InventoryCountSessionResponse>(`/api/inventory-counts/${id}`).then((response) => response.data);
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
  createAdjustments(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/create-adjustments`).then((response) => response.data);
  },
  cancel(id: number) {
    return apiClient.post<InventoryCountSessionResponse>(`/api/inventory-counts/${id}/cancel`).then((response) => response.data);
  },
};
