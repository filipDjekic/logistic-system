import { apiClient } from '../../../core/api/client';
import type {
  EmployeeOption,
  ProductOption,
  TransportOrderCreateRequest,
  TransportOrderItemCreateRequest,
  TransportOrderItemResponse,
  TransportOrderResponse,
  TransportOrderStatus,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';

type EmployeeResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position:
    | 'MANAGER'
    | 'DISPATCHER'
    | 'DRIVER'
    | 'WAREHOUSE_OPERATOR'
    | 'ADMINISTRATIVE_WORKER';
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

export const transportOrdersApi = {
  getAll() {
    return apiClient
      .get<TransportOrderResponse[]>('/api/transport_orders')
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
      items.filter((item) => item.transportOrderId === transportOrderId),
    );
  },

  createItem(payload: TransportOrderItemCreateRequest) {
    return apiClient
      .post<TransportOrderItemResponse>('/api/transport_order_items', payload)
      .then((response) => response.data);
  },

  deleteItem(id: number) {
    return apiClient.delete(`/api/transport_order_items/${id}`).then((response) => response.data);
  },

  getWarehouses() {
    return apiClient
      .get<WarehouseResponse[]>('/api/warehouses')
      .then((response) =>
        response.data.map<WarehouseOption>((warehouse) => ({
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
      .get<VehicleResponse[]>('/api/vehicles')
      .then((response) =>
        response.data.map<VehicleOption>((vehicle) => ({
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
      .get<EmployeeResponse[]>('/api/employees')
      .then((response) =>
        response.data.map<EmployeeOption>((employee) => ({
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