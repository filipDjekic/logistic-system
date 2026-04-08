import { apiClient } from '../../../core/api/client';
import type {
  StockMovementCreateRequest,
  StockMovementProductOption,
  StockMovementResponse,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';

export const stockMovementsApi = {
  getAll() {
    return apiClient
      .get<StockMovementResponse[]>('/api/stock_movements')
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
      .get<StockMovementWarehouseOption[]>('/api/warehouses')
      .then((response) => response.data);
  },

  getProducts() {
    return apiClient
      .get<StockMovementProductOption[]>('/api/products')
      .then((response) => response.data);
  },

  getTransportOrders() {
    return apiClient
      .get<StockMovementTransportOrderOption[]>('/api/transport_orders')
      .then((response) => response.data);
  },
};