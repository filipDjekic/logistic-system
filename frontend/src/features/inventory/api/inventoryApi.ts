import { apiClient } from '../../../core/api/client';
import type {
  InventoryProductOption,
  InventoryWarehouseOption,
  WarehouseInventoryResponse,
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