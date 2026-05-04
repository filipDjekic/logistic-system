import { apiClient } from '../../../core/api/client';
import { unwrapPageContent } from '../../../core/api/pagination';
import { compactParams, enumFilter, trimSearch } from '../../../core/api/params';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  StockAdjustmentRequest,
  StockInboundRequest,
  StockMovementFiltersState,
  StockMovementProductOption,
  StockMovementResponse,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
  StockOutboundRequest,
  StockReturnRequest,
  StockTransferRequest,
  StockWriteOffRequest,
} from '../types/stockMovement.types';

function buildStockMovementParams(filters?: Partial<StockMovementFiltersState> & PageParams) {
  if (!filters) {
    return undefined;
  }

  return compactParams({
    search: trimSearch(filters.search),
    page: filters.page,
    size: filters.size,
    sort: filters.sort,
    movementType: enumFilter(filters.movementType),
    warehouseId: enumFilter(filters.warehouseId),
    productId: enumFilter(filters.productId),
    transportOrderId: enumFilter(filters.transportOrderId),
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  });
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

  inbound(payload: StockInboundRequest) {
    return apiClient
      .post<StockMovementResponse>('/api/stock_movements/inbound', payload)
      .then((response) => response.data);
  },

  outbound(payload: StockOutboundRequest) {
    return apiClient
      .post<StockMovementResponse>('/api/stock_movements/outbound', payload)
      .then((response) => response.data);
  },

  transfer(payload: StockTransferRequest) {
    return apiClient
      .post<StockMovementResponse[]>('/api/stock_movements/transfer', payload)
      .then((response) => response.data);
  },

  adjustment(payload: StockAdjustmentRequest) {
    return apiClient
      .post<StockMovementResponse>('/api/stock_movements/adjustment', payload)
      .then((response) => response.data);
  },

  writeOff(payload: StockWriteOffRequest) {
    return apiClient
      .post<StockMovementResponse>('/api/stock_movements/write-off', payload)
      .then((response) => response.data);
  },

  returnStock(payload: StockReturnRequest) {
    return apiClient
      .post<StockMovementResponse>('/api/stock_movements/return', payload)
      .then((response) => response.data);
  },

  getWarehouses(search?: string) {
    return apiClient
      .get<StockMovementWarehouseOption[] | PageResponse<StockMovementWarehouseOption>>('/api/warehouses', {
        params: compactParams({ search: trimSearch(search), size: 25, sort: 'name,asc' }),
      })
      .then((response) => unwrapPageContent(response.data));
  },

  getProducts(search?: string) {
    return apiClient
      .get<StockMovementProductOption[] | PageResponse<StockMovementProductOption>>('/api/products', {
        params: compactParams({ search: trimSearch(search), size: 25, sort: 'name,asc' }),
      })
      .then((response) => unwrapPageContent(response.data));
  },

  getTransportOrders(search?: string) {
    return apiClient
      .get<StockMovementTransportOrderOption[] | PageResponse<StockMovementTransportOrderOption>>('/api/transport_orders', {
        params: compactParams({ search: trimSearch(search), size: 25, sort: 'createdAt,desc' }),
      })
      .then((response) => unwrapPageContent(response.data));
  },
};
