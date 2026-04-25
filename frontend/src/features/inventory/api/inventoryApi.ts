import { apiClient } from '../../../core/api/client';
import { unwrapPageContent } from '../../../core/api/pagination';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  InventoryFiltersState,
  InventoryProductOption,
  InventoryWarehouseOption,
  WarehouseInventoryCreateRequest,
  WarehouseInventoryResponse,
  WarehouseInventoryUpdateRequest,
} from '../types/inventory.types';

function buildInventoryParams(filters: InventoryFiltersState & PageParams) {
  return {
    search: filters.search?.trim() || undefined,
    warehouseId: filters.warehouseId === 'ALL' ? undefined : filters.warehouseId,
    productId: filters.productId === 'ALL' ? undefined : filters.productId,
    status: filters.status === 'ALL' ? undefined : filters.status,
    page: filters.page,
    size: filters.size,
    sort: filters.sort,
  };
}

export const inventoryApi = {
  getInventory(filters: InventoryFiltersState & PageParams) {
    return apiClient
      .get<PageResponse<WarehouseInventoryResponse>>('/api/warehouse-inventory', {
        params: buildInventoryParams(filters),
      })
      .then((response) => response.data);
  },

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
      .get<InventoryWarehouseOption[] | PageResponse<InventoryWarehouseOption>>('/api/warehouses', { params: { size: 1000, sort: 'name,asc' } })
      .then((response) => unwrapPageContent(response.data));
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
