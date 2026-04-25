import { apiClient } from '../../../core/api/client';

export type RecentActivityResponse = {
  id: number;
  action: string;
  entityName: string;
  entityId: number | null;
  entityIdentifier: string | null;
  description: string | null;
  createdAt: string;
  userId: number | null;
  userEmail: string | null;
};

export type OverlordRecentActivityResponse = RecentActivityResponse;

export type OverlordDashboardResponse = {
  companiesTotal: number;
  activeCompanies: number;
  usersTotal: number;
  usersByStatus: Record<string, number>;
  employeesTotal: number;
  activeEmployees: number;
  transportOrdersTotal: number;
  transportOrdersByStatus: Record<string, number>;
  tasksTotal: number;
  tasksByStatus: Record<string, number>;
  vehiclesTotal: number;
  vehiclesByStatus: Record<string, number>;
  warehousesTotal: number;
  productsTotal: number;
  inventoryRowsTotal: number;
  lowStockRowsTotal: number;
  inventoryQuantityTotal: string;
  inventoryAvailableQuantityTotal: string;
  stockMovementsTotal: number;
  activityLogsTotal: number;
  changeHistoryTotal: number;
  recentActivities: OverlordRecentActivityResponse[];
};

export type CompanyAdminDashboardResponse = {
  employeesTotal: number;
  activeEmployees: number;
  transportOrdersTotal: number;
  activeTransportOrders: number;
  transportOrdersByStatus: Record<string, number>;
  tasksTotal: number;
  openTasksTotal: number;
  tasksByStatus: Record<string, number>;
  vehiclesTotal: number;
  vehiclesByStatus: Record<string, number>;
  warehousesTotal: number;
  productsTotal: number;
  inventoryRowsTotal: number;
  lowStockRowsTotal: number;
  inventoryQuantityTotal: string;
  inventoryAvailableQuantityTotal: string;
  stockMovementsTotal: number;
  activityLogsTotal: number;
  changeHistoryTotal: number;
  recentActivities: RecentActivityResponse[];
};

export type HrManagerDashboardResponse = {
  employeesTotal: number;
  activeEmployees: number;
  inactiveEmployees: number;
  employeesByPosition: Record<string, number>;
  activeShifts: number;
  plannedShifts: number;
  employeesWithoutActiveOrPlannedShift: number;
  newEmployeesLast30Days: number;
  deactivatedEmployees: number;
  hrTasksTotal: number;
  hrTasksByStatus: Record<string, number>;
};

export type WarehouseManagerInventorySummaryResponse = {
  warehouseId: number;
  warehouseName: string;
  inventoryRowsTotal: number;
  lowStockRowsTotal: number;
  quantityTotal: string;
  reservedQuantityTotal: string;
  availableQuantityTotal: string;
};

export type WarehouseManagerLowStockItemResponse = {
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  quantity: string;
  reservedQuantity: string;
  availableQuantity: string;
  minStockLevel: string;
};

export type WarehouseManagerRecentStockMovementResponse = {
  id: number;
  movementType: string;
  quantity: string;
  reasonCode: string;
  referenceType: string;
  referenceId: number | null;
  referenceNumber: string | null;
  createdAt: string;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
};

export type WarehouseManagerDashboardResponse = {
  managedWarehousesTotal: number;
  inventoryRowsTotal: number;
  lowStockRowsTotal: number;
  inventoryQuantityTotal: string;
  inventoryReservedQuantityTotal: string;
  inventoryAvailableQuantityTotal: string;
  stockMovementsTotal: number;
  activeTransportOrdersAffectingWarehouses: number;
  warehouseTasksTotal: number;
  openWarehouseTasksTotal: number;
  warehouseTasksByStatus: Record<string, number>;
  warehouseInventorySummaries: WarehouseManagerInventorySummaryResponse[];
  lowStockItems: WarehouseManagerLowStockItemResponse[];
  recentStockMovements: WarehouseManagerRecentStockMovementResponse[];
};

export type DispatcherRecentTransportOrderResponse = {
  id: number;
  orderNumber: string;
  status: string;
  priority: string;
  totalWeight: string;
  departureTime: string | null;
  plannedArrivalTime: string | null;
  sourceWarehouseId: number | null;
  sourceWarehouseName: string | null;
  destinationWarehouseId: number | null;
  destinationWarehouseName: string | null;
  vehicleId: number | null;
  vehicleRegistrationNumber: string | null;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
};

export type DispatcherAvailableVehicleResponse = {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: string;
};

export type DispatcherAvailableDriverResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export type DispatcherDashboardResponse = {
  transportOrdersTotal: number;
  activeTransportOrders: number;
  unassignedTransportOrders: number;
  transportOrdersByStatus: Record<string, number>;
  vehiclesTotal: number;
  availableVehicles: number;
  vehiclesInUse: number;
  vehiclesByStatus: Record<string, number>;
  driversTotal: number;
  activeDrivers: number;
  busyDrivers: number;
  availableDrivers: number;
  dispatcherTasksTotal: number;
  openDispatcherTasksTotal: number;
  dispatcherTasksByStatus: Record<string, number>;
  recentTransportOrders: DispatcherRecentTransportOrderResponse[];
  availableVehicleCandidates: DispatcherAvailableVehicleResponse[];
  availableDriverCandidates: DispatcherAvailableDriverResponse[];
};

export type DriverTransportOrderResponse = {
  id: number;
  orderNumber: string;
  status: string;
  priority: string;
  totalWeight: string;
  departureTime: string | null;
  plannedArrivalTime: string | null;
  actualArrivalTime: string | null;
  sourceWarehouseId: number | null;
  sourceWarehouseName: string | null;
  destinationWarehouseId: number | null;
  destinationWarehouseName: string | null;
  vehicleId: number | null;
  vehicleRegistrationNumber: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  description: string | null;
};

export type DriverTaskResponse = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  transportOrderId: number | null;
  transportOrderNumber: string | null;
  transportOrderStatus: string | null;
};

export type DriverDashboardResponse = {
  activeTransportOrders: number;
  assignedTransportOrdersTotal: number;
  transportOrdersByStatus: Record<string, number>;
  transportTasksTotal: number;
  openTransportTasksTotal: number;
  transportTasksByStatus: Record<string, number>;
  nextTransportOrder: DriverTransportOrderResponse | null;
  activeTransportOrderList: DriverTransportOrderResponse[];
  transportTasks: DriverTaskResponse[];
};

export type WorkerTaskResponse = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  taskType: string;
  dueDate: string | null;
  stockMovementId: number | null;
  stockMovementType: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  productId: number | null;
  productName: string | null;
  transportOrderId: number | null;
  transportOrderNumber: string | null;
};

export type WorkerShiftResponse = {
  id: number;
  status: string;
  startTime: string;
  endTime: string;
  notes: string | null;
};

export type WorkerDashboardResponse = {
  openTasksTotal: number;
  todayTasksTotal: number;
  tasksByStatus: Record<string, number>;
  tasksByType: Record<string, number>;
  currentShift: WorkerShiftResponse | null;
  nextShift: WorkerShiftResponse | null;
  openTasks: WorkerTaskResponse[];
  todayTasks: WorkerTaskResponse[];
};

export const dashboardApi = {
  getOverlordDashboard() {
    return apiClient
      .get<OverlordDashboardResponse>('/api/dashboard/overlord')
      .then((response) => response.data);
  },

  getCompanyAdminDashboard() {
    return apiClient
      .get<CompanyAdminDashboardResponse>('/api/dashboard/company-admin')
      .then((response) => response.data);
  },

  getHrManagerDashboard() {
    return apiClient
      .get<HrManagerDashboardResponse>('/api/dashboard/hr-manager')
      .then((response) => response.data);
  },

  getWarehouseManagerDashboard() {
    return apiClient
      .get<WarehouseManagerDashboardResponse>('/api/dashboard/warehouse-manager')
      .then((response) => response.data);
  },

  getDispatcherDashboard() {
    return apiClient
      .get<DispatcherDashboardResponse>('/api/dashboard/dispatcher')
      .then((response) => response.data);
  },

  getDriverDashboard() {
    return apiClient
      .get<DriverDashboardResponse>('/api/dashboard/driver')
      .then((response) => response.data);
  },

  getWorkerDashboard() {
    return apiClient
      .get<WorkerDashboardResponse>('/api/dashboard/worker')
      .then((response) => response.data);
  },
};
