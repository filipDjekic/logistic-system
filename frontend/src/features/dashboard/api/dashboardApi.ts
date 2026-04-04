import { apiClient } from '../../../core/api/client';

export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TransportOrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type WarehouseStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'FULL'
  | 'UNDER_MAINTENANCE';

export type NotificationStatus = 'UNREAD' | 'READ';
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export type TaskResponse = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedEmployeeId: number | null;
  transportOrderId: number | null;
};

export type TransportOrderResponse = {
  id: number;
  orderNumber: string;
  description: string;
  orderDate: string;
  departureTime: string | null;
  plannedArrivalTime: string | null;
  actualArrivalTime: string | null;
  status: TransportOrderStatus;
  priority: PriorityLevel;
  totalWeight: string;
  notes: string | null;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  vehicleId: number | null;
  assignedEmployeeId: number | null;
  createdById: number;
};

export type VehicleResponse = {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: string;
  fuelType: string;
  yearOfProduction: number;
  status: VehicleStatus;
};

export type WarehouseResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: string;
  status: WarehouseStatus;
  employeeId: number | null;
};

export type WarehouseInventoryResponse = {
  warehouseId: number;
  productId: number;
  quantity: string;
  reservedQuantity: string;
  minStockLevel: string;
};

export type NotificationResponse = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string;
  userId: number;
};

export type NotificationPageResponse = {
  items: NotificationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  unreadCount: number;
};

export const dashboardApi = {
  getMyTasks() {
    return apiClient.get<TaskResponse[]>('/api/tasks/my').then((response) => response.data);
  },

  getMyUnreadNotificationsCount() {
    return apiClient.get<number>('/api/notifications/my/unread/count').then((response) => response.data);
  },

  getTransportOrders() {
    return apiClient
      .get<TransportOrderResponse[]>('/api/transport_orders')
      .then((response) => response.data);
  },

  getVehicles() {
    return apiClient.get<VehicleResponse[]>('/api/vehicles').then((response) => response.data);
  },

  getWarehouses() {
    return apiClient.get<WarehouseResponse[]>('/api/warehouses').then((response) => response.data);
  },

  getWarehouseInventory(warehouseId: number) {
    return apiClient
      .get<WarehouseInventoryResponse[]>(`/api/warehouses/${warehouseId}/inventory`)
      .then((response) => response.data);
  },
};