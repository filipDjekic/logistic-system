import { apiClient } from '../../../core/api/client';

export type TransportReportFilters = {
  fromDate?: string;
  toDate?: string;
  status?: string;
  priority?: string;
  sourceWarehouseId?: number;
  destinationWarehouseId?: number;
  vehicleId?: number;
  assignedEmployeeId?: number;
};

export type VehicleUsageResponse = {
  vehicleId: number;
  registrationNumber: string;
  vehicleLabel: string;
  transportsTotal: number;
  completedTransports: number;
  totalWeight: number;
};

export type DriverUsageResponse = {
  employeeId: number;
  driverName: string;
  driverEmail: string;
  transportsTotal: number;
  completedTransports: number;
  totalWeight: number;
};

export type RouteUsageResponse = {
  sourceWarehouseId: number;
  sourceWarehouseName: string;
  destinationWarehouseId: number;
  destinationWarehouseName: string;
  transportsTotal: number;
  completedTransports: number;
  totalWeight: number;
};

export type TransportReportRowResponse = {
  id: number;
  orderNumber: string;
  status: string;
  priority: string;
  totalWeight: number;
  orderDate: string | null;
  departureTime: string | null;
  plannedArrivalTime: string | null;
  actualArrivalTime: string | null;
  sourceWarehouseId: number | null;
  sourceWarehouseName: string | null;
  destinationWarehouseId: number | null;
  destinationWarehouseName: string | null;
  vehicleId: number | null;
  vehicleRegistrationNumber: string | null;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
};

export type TransportReportResponse = {
  fromDate: string | null;
  toDate: string | null;
  totalTransports: number;
  activeTransports: number;
  completedTransports: number;
  cancelledTransports: number;
  totalPlannedWeight: number;
  completedTransportWeight: number;
  transportsByStatus: Record<string, number>;
  transportsByPriority: Record<string, number>;
  vehicleUsage: VehicleUsageResponse[];
  driverUsage: DriverUsageResponse[];
  routeUsage: RouteUsageResponse[];
  rows: TransportReportRowResponse[];
};

export type InventoryReportFilters = {
  fromDate?: string;
  toDate?: string;
  warehouseId?: number;
  productId?: number;
  movementType?: string;
};

export type WarehouseInventorySummaryResponse = {
  warehouseId: number;
  warehouseName: string;
  city: string | null;
  inventoryRows: number;
  lowStockRows: number;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  stockMovements: number;
};

export type ProductInventorySummaryResponse = {
  productId: number;
  productName: string;
  sku: string | null;
  unit: string | null;
  inventoryRows: number;
  lowStockRows: number;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  stockMovements: number;
};

export type InventoryReportRowResponse = {
  warehouseId: number | null;
  warehouseName: string | null;
  productId: number | null;
  productName: string | null;
  sku: string | null;
  unit: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStockLevel: number | null;
  lowStock: boolean;
  lastUpdated: string | null;
};

export type StockMovementReportRowResponse = {
  id: number;
  movementType: string | null;
  quantity: number;
  reasonCode: string | null;
  referenceType: string | null;
  referenceId: number | null;
  referenceNumber: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  productId: number | null;
  productName: string | null;
  sku: string | null;
  createdAt: string | null;
};

export type InventoryReportResponse = {
  fromDate: string | null;
  toDate: string | null;
  inventoryRowsTotal: number;
  lowStockRowsTotal: number;
  totalInventoryQuantity: number;
  totalAvailableQuantity: number;
  totalReservedQuantity: number;
  stockMovementsTotal: number;
  inboundQuantity: number;
  outboundQuantity: number;
  transferQuantity: number;
  adjustmentQuantity: number;
  movementsByType: Record<string, number>;
  perWarehouse: WarehouseInventorySummaryResponse[];
  perProduct: ProductInventorySummaryResponse[];
  inventoryRows: InventoryReportRowResponse[];
  movementRows: StockMovementReportRowResponse[];
};

function buildTransportReportParams(filters: TransportReportFilters) {
  const params: Record<string, string | number> = {};

  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.status && filters.status !== 'ALL') params.status = filters.status;
  if (filters.priority && filters.priority !== 'ALL') params.priority = filters.priority;
  if (filters.sourceWarehouseId) params.sourceWarehouseId = filters.sourceWarehouseId;
  if (filters.destinationWarehouseId) params.destinationWarehouseId = filters.destinationWarehouseId;
  if (filters.vehicleId) params.vehicleId = filters.vehicleId;
  if (filters.assignedEmployeeId) params.assignedEmployeeId = filters.assignedEmployeeId;

  return params;
}

function buildInventoryReportParams(filters: InventoryReportFilters) {
  const params: Record<string, string | number> = {};

  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.warehouseId) params.warehouseId = filters.warehouseId;
  if (filters.productId) params.productId = filters.productId;
  if (filters.movementType && filters.movementType !== 'ALL') params.movementType = filters.movementType;

  return params;
}

export const reportsApi = {
  getTransportReport(filters: TransportReportFilters) {
    return apiClient
      .get<TransportReportResponse>('/api/reports/transport', {
        params: buildTransportReportParams(filters),
      })
      .then((response) => response.data);
  },

  getInventoryReport(filters: InventoryReportFilters) {
    return apiClient
      .get<InventoryReportResponse>('/api/reports/inventory', {
        params: buildInventoryReportParams(filters),
      })
      .then((response) => response.data);
  },
};

export type EmployeeTaskReportFilters = {
  fromDate?: string;
  toDate?: string;
  employeeId?: number;
  position?: string;
  taskStatus?: string;
  taskPriority?: string;
};

export type TaskAssigneeSummaryResponse = {
  employeeId: number;
  employeeName: string;
  position: string | null;
  tasksTotal: number;
  completedTasks: number;
  openTasks: number;
  overdueOpenTasks: number;
};

export type EmployeeTaskReportRowResponse = {
  employeeId: number;
  employeeName: string;
  email: string;
  position: string | null;
  active: boolean;
  employmentDate: string | null;
  userId: number | null;
  tasksTotal: number;
  completedTasks: number;
  openTasks: number;
  shiftsTotal: number;
};

export type TaskReportRowResponse = {
  taskId: number;
  title: string;
  status: string | null;
  priority: string | null;
  dueDate: string | null;
  createdAt: string | null;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
  assignedEmployeePosition: string | null;
  transportOrderId: number | null;
  stockMovementId: number | null;
};

export type ShiftReportRowResponse = {
  shiftId: number;
  status: string | null;
  startTime: string | null;
  endTime: string | null;
  employeeId: number | null;
  employeeName: string | null;
  employeePosition: string | null;
};

export type EmployeeTaskReportResponse = {
  fromDate: string | null;
  toDate: string | null;
  employeesTotal: number;
  activeEmployees: number;
  inactiveEmployees: number;
  tasksTotal: number;
  completedTasks: number;
  openTasks: number;
  overdueOpenTasks: number;
  shiftsTotal: number;
  employeesWithoutTasks: number;
  employeesByPosition: Record<string, number>;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  shiftsByStatus: Record<string, number>;
  tasksByAssignee: TaskAssigneeSummaryResponse[];
  employeeRows: EmployeeTaskReportRowResponse[];
  taskRows: TaskReportRowResponse[];
  shiftRows: ShiftReportRowResponse[];
};

function buildEmployeeTaskReportParams(filters: EmployeeTaskReportFilters) {
  const params: Record<string, string | number> = {};

  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.position && filters.position !== 'ALL') params.position = filters.position;
  if (filters.taskStatus && filters.taskStatus !== 'ALL') params.taskStatus = filters.taskStatus;
  if (filters.taskPriority && filters.taskPriority !== 'ALL') params.taskPriority = filters.taskPriority;

  return params;
}

export const employeeTaskReportsApi = {
  getEmployeeTaskReport(filters: EmployeeTaskReportFilters) {
    return apiClient
      .get<EmployeeTaskReportResponse>('/api/reports/employee-tasks', {
        params: buildEmployeeTaskReportParams(filters),
      })
      .then((response) => response.data);
  },
};
