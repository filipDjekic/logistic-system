import { apiClient } from '../../../core/api/client';
import { unwrapPageContent } from '../../../core/api/pagination';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  StockMovementCreateRequest,
  StockMovementFiltersState,
  StockMovementProductOption,
  StockMovementResponse,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';

function buildStockMovementParams(filters?: Partial<StockMovementFiltersState> & PageParams) {
  if (!filters) {
    return undefined;
  }

  return {
    search: filters.search?.trim() || undefined,
    page: filters.page,
    size: filters.size,
    sort: filters.sort,
    movementType: filters.movementType === 'ALL' ? undefined : filters.movementType,
    warehouseId: filters.warehouseId === 'ALL' ? undefined : filters.warehouseId,
    productId: filters.productId === 'ALL' ? undefined : filters.productId,
  };
}

export const stockMovementsApi = {
  getAll(filters?: Partial<StockMovementFiltersState> & PageParams) {
    return apiClient
      .get<PageResponse<StockMovementResponse>>('/api/stock_movements', {
        params: buildStockMovementParams(filters),
      })
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<StockMovementResponse>(`/api/stock_movements/${id}`)
      .then((response) => response.data);
  },

  create(payload: StockMovementCreateRequest) {
    return apiClient
      .post<StockMovementResponse>('/api/stock_movements', payload)
      .then((response) => response.data);
  },

  getWarehouses() {
    return apiClient
      .get<StockMovementWarehouseOption[] | PageResponse<StockMovementWarehouseOption>>('/api/warehouses', { params: { size: 1000, sort: 'name,asc' } })
      .then((response) => unwrapPageContent(response.data));
  },

  getProducts() {
    return apiClient
      .get<StockMovementProductOption[] | PageResponse<StockMovementProductOption>>('/api/products', { params: { size: 1000, sort: 'name,asc' } })
      .then((response) => unwrapPageContent(response.data));
  },

  getTransportOrders() {
    return apiClient
      .get<StockMovementTransportOrderOption[] | PageResponse<StockMovementTransportOrderOption>>('/api/transport_orders', { params: { size: 1000, sort: 'createdAt,desc' } })
      .then((response) => unwrapPageContent(response.data));
  },
};
