import { apiClient } from '../../../core/api/client';
import { unwrapPageContent } from '../../../core/api/pagination';
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
  TransportOrderUpdateRequest,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';

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
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
};

function buildTransportOrderParams(filters?: TransportOrderListFilters & PageParams) {
  if (!filters) {
    return undefined;
  }

  const params: Record<string, string | number> = {};

  if (filters.page != null) {
    params.page = filters.page;
  }

  if (filters.size != null) {
    params.size = filters.size;
  }

  if (filters.sort) {
    params.sort = filters.sort;
  }
  const search = filters.search?.trim();

  if (search) {
    params.search = search;
  }

  if (filters.status && filters.status !== 'ALL') {
    params.status = filters.status;
  }

  if (filters.priority && filters.priority !== 'ALL') {
    params.priority = filters.priority;
  }

  if (filters.sourceWarehouseId) {
    params.sourceWarehouseId = filters.sourceWarehouseId;
  }

  if (filters.destinationWarehouseId) {
    params.destinationWarehouseId = filters.destinationWarehouseId;
  }

  if (filters.vehicleId) {
    params.vehicleId = filters.vehicleId;
  }

  if (filters.assignedEmployeeId) {
    params.assignedEmployeeId = filters.assignedEmployeeId;
  }

  if (filters.fromDate) {
    params.fromDate = filters.fromDate;
  }

  if (filters.toDate) {
    params.toDate = filters.toDate;
  }

  return params;
}

export const transportOrdersApi = {
  getAll(filters?: TransportOrderListFilters & PageParams) {
    return apiClient
      .get<PageResponse<TransportOrderResponse>>('/api/transport_orders', {
        params: buildTransportOrderParams(filters),
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

  updateStatus(id: number, status: TransportOrderStatus) {
    return apiClient
      .patch<TransportOrderResponse>(`/api/transport_orders/${id}/status`, { status })
      .then((response) => response.data);
  },

  getAllItems() {
    return apiClient
      .get<TransportOrderItemResponse[]>('/api/transport_order_items')
      .then((response) => response.data);
  },

  getItemsByTransportOrderId(transportOrderId: number) {
    return transportOrdersApi.getAllItems().then((items) =>
      items
        .filter((item) => item.transportOrderId === transportOrderId)
        .sort((a, b) => a.id - b.id),
    );
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
      .get<WarehouseResponse[] | PageResponse<WarehouseResponse>>('/api/warehouses', { params: { size: 1000, sort: 'name,asc' } })
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
      .get<VehicleResponse[] | PageResponse<VehicleResponse>>('/api/vehicles', { params: { size: 1000, sort: 'registrationNumber,asc' } })
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
      .get<EmployeeResponse[] | PageResponse<EmployeeResponse>>('/api/employees', { params: { size: 1000, sort: 'lastName,asc' } })
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
      .get<ProductResponse[]>('/api/products')
      .then((response) =>
        response.data.map<ProductOption>((product) => ({
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
