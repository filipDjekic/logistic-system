import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type { WarehouseInventoryResponse } from '../../inventory/types/inventory.types';
import type { StockMovementFiltersState, StockMovementResponse } from '../../stock-movements/types/stockMovement.types';
import type { TransportOrderItemResponse } from '../../transport-orders/types/transportOrder.types';
import type { BinInventoryResponse } from '../../warehouse-locations/types/warehouseLocation.types';
import type { ProductCreateRequest, ProductResponse, ProductUpdateRequest } from '../types/product.types';

export type ProductSearchParams = PageParams & {
  search?: string;
  active?: boolean;
};

export const productsApi = {
  getAll: async (params: ProductSearchParams = {}) => {
    const res = await apiClient.get<PageResponse<ProductResponse>>('/api/products', { params });
    return res.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<ProductResponse>(`/api/products/${id}`);
    return res.data;
  },

  getInventoryByWarehouse: async (productId: number) => {
    const res = await apiClient.get<WarehouseInventoryResponse[]>(`/api/warehouse-inventory/product/${productId}`);
    return res.data;
  },

  getBinDistribution: async (productId: number) => {
    const res = await apiClient.get<PageResponse<BinInventoryResponse>>('/api/warehouse-locations/bin-inventory', {
      params: { productId, page: 0, size: 100, sort: 'warehouse.name,asc' },
    });
    return res.data;
  },

  getStockMovements: async (productId: number, params: Partial<StockMovementFiltersState> & PageParams = {}) => {
    const res = await apiClient.get<PageResponse<StockMovementResponse>>('/api/stock-movements', {
      params: { ...params, productId },
    });
    return res.data;
  },

  getTransportUsage: async (productId: number) => {
    const res = await apiClient.get<PageResponse<TransportOrderItemResponse>>('/api/transport-order-items', {
      params: { productId, page: 0, size: 100, sort: 'id,desc' },
    });
    return res.data;
  },

  create: async (data: ProductCreateRequest) => {
    const res = await apiClient.post<ProductResponse>('/api/products', data);
    return res.data;
  },

  update: async ({ id, data }: { id: number; data: ProductUpdateRequest }) => {
    const res = await apiClient.put<ProductResponse>(`/api/products/${id}`, data);
    return res.data;
  },

  archive: async (id: number) => {
    const res = await apiClient.patch<ProductResponse>(`/api/products/${id}/archive`);
    return res.data;
  },

  restore: async (id: number) => {
    const res = await apiClient.patch<ProductResponse>(`/api/products/${id}/restore`);
    return res.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/products/${id}`);
  },
};
