import { apiClient } from '../../../core/api/client';

export type DashboardChartItemResponse = {
  key: string;
  label: string;
  value: number | string;
  secondaryValue: number | string | null;
};

export type DashboardChartResponse = {
  key: string;
  title: string;
  type: string;
  items: DashboardChartItemResponse[];
};

export type DashboardAlertResponse = {
  severity: string;
  key: string;
  title: string;
  message: string;
  count: number;
};


export type OperationalWidgetResponse = {
  key: string;
  title: string;
  description: string;
  value: number;
  severity: string;
  route: string;
  actionLabel: string;
};

export type OperationalFlowResponse = {
  key: string;
  title: string;
  description: string;
  entityType: string;
  entityId: number | null;
  route: string;
  status: string;
  severity: string;
  dueAt: string | null;
};

export type OperationalNextActionResponse = {
  key: string;
  title: string;
  description: string;
  route: string;
  actionLabel: string;
  priority: string;
};

export type OperationalLiveAlertResponse = {
  key: string;
  title: string;
  message: string;
  severity: string;
  route: string | null;
  actionLabel: string | null;
  detectedAt: string | null;
};

export type OperationalIncidentResponse = {
  key: string;
  title: string;
  description: string;
  count: number;
  severity: string;
  route: string | null;
  actionLabel: string | null;
};

export type OperationalWorkloadResponse = {
  key: string;
  title: string;
  description: string;
  openCount: number;
  blockedCount: number;
  overdueCount: number;
  severity: string;
  route: string | null;
};

export type OperationalWarehouseCongestionResponse = {
  warehouseId: number;
  warehouseName: string;
  inventoryRows: number;
  capacityUsedPercent: string;
  severity: string;
  route: string | null;
};

export type OperationalSlaResponse = {
  overdueTasks: number;
  delayedTransports: number;
  dueSoonTasks: number;
  dueSoonTransports: number;
  severity: string;
};

export type OperationalDashboardResponse = {
  generatedAt: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  widgets: OperationalWidgetResponse[];
  flows: OperationalFlowResponse[];
  nextActions?: OperationalNextActionResponse[];
  liveAlerts?: OperationalLiveAlertResponse[];
  incidents?: OperationalIncidentResponse[];
  workload?: OperationalWorkloadResponse[];
  warehouseCongestion?: OperationalWarehouseCongestionResponse[];
  sla?: OperationalSlaResponse | null;
};

export type LifecycleAlertResponse = {
  severity: string;
  key: string;
  title: string;
  message: string;
  count: number;
  entityType: string;
  route: string | null;
};

export type LifecycleAnalyticsResponse = {
  generatedAt: string;
  alerts: LifecycleAlertResponse[];
  tasksByStatus: Record<string, number>;
  transportsByStatus: Record<string, number>;
  vehiclesByStatus: Record<string, number>;
  overdueTasks: number;
  blockedTasks: number;
  stuckTasks: number;
  overdueTransports: number;
  staleReservedVehicles: number;
  activeOperationalFlows: number;
};

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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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
  charts: DashboardChartResponse[];
  alerts: DashboardAlertResponse[];
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

  getOperationalDashboard() {
    return apiClient
      .get<OperationalDashboardResponse>('/api/dashboard/operational')
      .then((response) => response.data);
  },

  getLifecycleMonitoring() {
    return apiClient
      .get<LifecycleAnalyticsResponse>('/api/lifecycle-monitoring')
      .then((response) => response.data);
  },
};
