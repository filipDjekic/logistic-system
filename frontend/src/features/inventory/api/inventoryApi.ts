import { apiClient } from '../../../core/api/client';
import type {
  InventoryProductOption,
  InventoryWarehouseOption,
  WarehouseInventoryCreateRequest,
  WarehouseInventoryResponse,
  WarehouseInventoryUpdateRequest,
} from '../types/inventory.types';

export const inventoryApi = {
  getInventoryRecord(warehouseId: number, productId: number) {
    return apiClient
      .get<WarehouseInventoryResponse>(`/api/warehouse-inventory/${warehouseId}/${productId}`)
      .then((response) => response.data);
  },

  getInventoryByWarehouse(warehouseId: number) {
    return apiClient
      .get<WarehouseInventoryResponse[]>(`/api/warehouse-inventory/warehouse/${warehouseId}`)
      .then((response) => response.data);
  },

  createInventoryRecord(data: WarehouseInventoryCreateRequest) {
    return apiClient
      .post<WarehouseInventoryResponse>('/api/warehouse-inventory', data)
      .then((response) => response.data);
  },

  updateInventoryRecord(
    warehouseId: number,
    productId: number,
    data: WarehouseInventoryUpdateRequest,
  ) {
    return apiClient
      .put<WarehouseInventoryResponse>(
        `/api/warehouse-inventory/${warehouseId}/${productId}`,
        data,
      )
      .then((response) => response.data);
  },

  deleteInventoryRecord(warehouseId: number, productId: number) {
    return apiClient.delete(`/api/warehouse-inventory/${warehouseId}/${productId}`);
  },

  getWarehouses() {
    return apiClient
      .get<InventoryWarehouseOption[]>('/api/warehouses')
      .then((response) => response.data);
  },

  getWarehouseById(id: number) {
    return apiClient
      .get<InventoryWarehouseOption>(`/api/warehouses/${id}`)
      .then((response) => response.data);
  },

  getProducts() {
    return apiClient
      .get<InventoryProductOption[]>('/api/products')
      .then((response) => response.data);
  },

  getProductById(id: number) {
    return apiClient
      .get<InventoryProductOption>(`/api/products/${id}`)
      .then((response) => response.data);
  },
};