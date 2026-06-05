import { apiClient } from '../../../core/api/client';
import { unwrapPageContent } from '../../../core/api/pagination';
import { compactParams, enumFilter, trimSearch } from '../../../core/api/params';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  EmployeeOption,
  ProductOption,
  TransportOrderCreateRequest,
  TransportOrderItemCreateRequest,
  TransportOrderItemResponse,
  TransportOrderItemUpdateRequest,
  TransportOrderListFilters,
  TransportOrderResponse,
  TransportOrderStatus,
  AllowedStatusTransitionsResponse,
  TransportOrderUpdateRequest,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';

export type StatusCountResponse = {
  status: string;
  count: number;
};

type EmployeeResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position:
    | 'OVERLORD'
    | 'COMPANY_ADMIN'
    | 'HR_MANAGER'
    | 'DISPATCHER'
    | 'DRIVER'
    | 'WAREHOUSE_MANAGER'
    | 'WORKER';
};

type ProductResponse = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  unit: string;
  price: number;
  fragile: boolean;
  weight: number | null;
};

type WarehouseResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FULL' | 'UNDER_MAINTENANCE';
  employeeId: number | null;
};

type VehicleResponse = {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: number;
  fuelType: string;
  yearOfProduction: number;
  status: 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
};

function buildTransportOrderParams(filters?: TransportOrderListFilters & PageParams) {
  if (!filters) {
    return undefined;
  }

  return compactParams({
    page: filters.page,
    size: filters.size,
    sort: filters.sort,
    search: trimSearch(filters.search),
    status: enumFilter(filters.status),
    priority: enumFilter(filters.priority),
    sourceWarehouseId: filters.sourceWarehouseId,
    destinationWarehouseId: filters.destinationWarehouseId,
    vehicleId: filters.vehicleId,
    assignedEmployeeId: filters.assignedEmployeeId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
}

export const transportOrdersApi = {
  getAll(filters?: TransportOrderListFilters & PageParams) {
    return apiClient
      .get<PageResponse<TransportOrderResponse>>('/api/transport_orders', {
        params: buildTransportOrderParams(filters),
      })
      .then((response) => response.data);
  },


  getStatusCounts(filters?: Omit<TransportOrderListFilters, 'status'>) {
    return apiClient
      .get<StatusCountResponse[]>('/api/transport_orders/status-counts', {
        params: buildTransportOrderParams(filters as TransportOrderListFilters & PageParams | undefined),
      })
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<TransportOrderResponse>(`/api/transport_orders/${id}`)
      .then((response) => response.data);
  },

  create(payload: TransportOrderCreateRequest) {
    return apiClient
      .post<TransportOrderResponse>('/api/transport_orders', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: TransportOrderUpdateRequest) {
    return apiClient
      .put<TransportOrderResponse>(`/api/transport_orders/${id}`, payload)
      .then((response) => response.data);
  },

  getAllowedStatusTransitions(id: number) {
    return apiClient
      .get<AllowedStatusTransitionsResponse<TransportOrderStatus>>(`/api/transport_orders/${id}/status-transitions`)
      .then((response) => response.data);
  },

  updateStatus(id: number, status: TransportOrderStatus, reason?: string, expectedVersion?: number) {
    return apiClient
      .patch<TransportOrderResponse>(`/api/transport_orders/${id}/status`, { status, reason, expectedVersion })
      .then((response) => response.data);
  },

  getItemsByTransportOrderId(transportOrderId: number) {
    return apiClient
      .get<PageResponse<TransportOrderItemResponse>>('/api/transport_order_items', {
        params: { transportOrderId, page: 0, size: 100, sort: 'id,asc' },
      })
      .then((response) => response.data.content);
  },

  createItem(payload: TransportOrderItemCreateRequest) {
    return apiClient
      .post<TransportOrderItemResponse>('/api/transport_order_items', payload)
      .then((response) => response.data);
  },

  updateItem(id: number, payload: TransportOrderItemUpdateRequest) {
    return apiClient
      .put<TransportOrderItemResponse>(`/api/transport_order_items/${id}`, payload)
      .then((response) => response.data);
  },

  deleteItem(id: number) {
    return apiClient.delete(`/api/transport_order_items/${id}`).then((response) => response.data);
  },

  getWarehouses() {
    return apiClient
      .get<WarehouseResponse[] | PageResponse<WarehouseResponse>>('/api/warehouses', { params: { size: 25, sort: 'name,asc' } })
      .then((response) =>
        unwrapPageContent(response.data).map<WarehouseOption>((warehouse) => ({
          id: warehouse.id,
          name: warehouse.name,
          address: warehouse.address,
          city: warehouse.city,
          capacity: warehouse.capacity,
          status: warehouse.status,
          employeeId: warehouse.employeeId,
        })),
      );
  },

  getVehicles() {
    return apiClient
      .get<VehicleResponse[] | PageResponse<VehicleResponse>>('/api/vehicles', { params: { size: 25, sort: 'registrationNumber,asc' } })
      .then((response) =>
        unwrapPageContent(response.data).map<VehicleOption>((vehicle) => ({
          id: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          type: vehicle.type,
          capacity: vehicle.capacity,
          fuelType: vehicle.fuelType,
          yearOfProduction: vehicle.yearOfProduction,
          status: vehicle.status,
        })),
      );
  },

  getEmployees() {
    return apiClient
      .get<EmployeeResponse[] | PageResponse<EmployeeResponse>>('/api/employees', { params: { size: 25, sort: 'lastName,asc' } })
      .then((response) =>
        unwrapPageContent(response.data)
          .filter((employee) => employee.position === 'DRIVER')
          .map<EmployeeOption>((employee) => ({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            position: employee.position,
          })),
      );
  },

  getProducts() {
    return apiClient
      .get<ProductResponse[] | PageResponse<ProductResponse>>('/api/products', { params: { size: 25, sort: 'name,asc' } })
      .then((response) =>
        unwrapPageContent(response.data).map<ProductOption>((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          unit: product.unit,
          price: product.price,
          fragile: product.fragile,
          weight: product.weight,
        })),
      );
  },
};
