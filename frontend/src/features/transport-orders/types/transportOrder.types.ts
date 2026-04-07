export type TransportOrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type TransportOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TransportOrderResponse = {
  id: number;
  orderNumber: string;
  description: string;
  orderDate: string;
  departureTime: string;
  plannedArrivalTime: string;
  actualArrivalTime: string | null;
  status: TransportOrderStatus;
  priority: TransportOrderPriority;
  totalWeight: number | null;
  notes: string | null;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  vehicleId: number;
  assignedEmployeeId: number;
  createdById: number;
};

export type TransportOrderCreateRequest = {
  orderNumber: string;
  description: string;
  orderDate: string;
  departureTime: string;
  plannedArrivalTime: string;
  priority: TransportOrderPriority;
  notes?: string;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  vehicleId: number;
  assignedEmployeeId: number;
};

export type TransportOrderUpdateRequest = {
  id?: number;
  orderNumber: string;
  description: string;
  orderDate: string;
  departureTime: string;
  plannedArrivalTime: string;
  actualArrivalTime?: string | null;
  priority: TransportOrderPriority;
  notes?: string;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  vehicleId: number;
  assignedEmployeeId: number;
};

export type TransportOrderStatusUpdateRequest = {
  status: TransportOrderStatus;
};

export type TransportOrderItemResponse = {
  id: number;
  quantity: number;
  weight: number;
  note: string | null;
  transportOrderId: number;
  productId: number;
};

export type TransportOrderItemCreateRequest = {
  quantity: number;
  note?: string;
  transportOrderId: number;
  productId: number;
};

export type WarehouseOption = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FULL' | 'UNDER_MAINTENANCE';
  employeeId: number | null;
};

export type VehicleOption = {
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

export type EmployeeOption = {
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

export type ProductOption = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  unit: string;
  price: number;
  fragile: boolean;
  weight: number | null;
};

export type TransportOrderFiltersState = {
  search: string;
  status: TransportOrderStatus | 'ALL';
  priority: TransportOrderPriority | 'ALL';
};

export type TransportOrderFormValues = {
  orderNumber: string;
  description: string;
  orderDate: string;
  departureTime: string;
  plannedArrivalTime: string;
  priority: TransportOrderPriority;
  notes: string;
  sourceWarehouseId: number | '';
  destinationWarehouseId: number | '';
  vehicleId: number | '';
  assignedEmployeeId: number | '';
};

export type TransportOrderItemFormValues = {
  productId: number | '';
  quantity: number | '';
  note: string;
};