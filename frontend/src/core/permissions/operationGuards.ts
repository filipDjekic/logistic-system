import { appConfig } from '../config/appConfig';
import { ROLES, type Role } from '../constants/roles';
import type { TaskResponse, TaskStatus } from '../../features/tasks/types/task.types';
import type { TransportOrderResponse, TransportOrderStatus } from '../../features/transport-orders/types/transportOrder.types';
import type { VehicleResponse, VehicleStatus } from '../../features/vehicles/types/vehicle.types';
import type { StockMovementResponse, StockMovementStatus } from '../../features/stock-movements/types/stockMovement.types';
import type { InventoryCountSessionStatus } from '../../features/inventory-counts/types/inventoryCount.types';


function uniqueStatuses<TStatus extends string>(statuses: readonly TStatus[]) {
  return Array.from(new Set(statuses));
}

export function filterAllowedStatusesByRole<TStatus extends string>(
  backendAllowedStatuses: readonly TStatus[] | null | undefined,
  roleAllowedStatuses: readonly TStatus[],
) {
  const roleAllowed = new Set(roleAllowedStatuses);
  const source = backendAllowedStatuses ?? roleAllowedStatuses;
  return uniqueStatuses(source.filter((status) => roleAllowed.has(status)));
}

export function canManageTransportOrders(role: Role | null | undefined) {
  return role === ROLES.OVERLORD || role === ROLES.DISPATCHER;
}

export function canReadTransportOrderStatusTransitions(role: Role | null | undefined) {
  return (
    role === ROLES.OVERLORD ||
    role === ROLES.COMPANY_ADMIN ||
    role === ROLES.DISPATCHER ||
    role === ROLES.WAREHOUSE_MANAGER ||
    role === ROLES.DRIVER
  );
}

export function canEditTransportOrder(role: Role | null | undefined, order: TransportOrderResponse | null | undefined) {
  return canManageTransportOrders(role) && order != null && order.status === 'DRAFT';
}

export function canMutateTransportOrderItems(role: Role | null | undefined, order: TransportOrderResponse | null | undefined) {
  return canManageTransportOrders(role) && order != null && order.status === 'DRAFT';
}

export function getAllowedTransportOrderStatusTransitions(
  role: Role | null | undefined,
  status: TransportOrderStatus,
): TransportOrderStatus[] {
  if (role === ROLES.DRIVER) {
    if (status === 'LOADING') {
      return ['IN_TRANSIT'];
    }

    if (status === 'IN_TRANSIT') {
      return ['DELIVERED', 'RETURNING', 'FAILED'];
    }

    if (status === 'RETURNING') {
      return ['FAILED'];
    }

    return [];
  }

  if (role === ROLES.WAREHOUSE_MANAGER) {
    if (status === 'PICKING') return ['PACKING'];
    if (status === 'PACKING') return ['READY_FOR_LOADING'];
    if (status === 'READY_FOR_LOADING') return ['LOADING'];
    return [];
  }

  if (role === ROLES.COMPANY_ADMIN || canManageTransportOrders(role)) {
    return [...appConfig.statusTransitions.transportOrder[status]];
  }

  return [];
}

export function canChangeTransportOrderStatus(
  role: Role | null | undefined,
  order: TransportOrderResponse | null | undefined,
) {
  return order != null && getAllowedTransportOrderStatusTransitions(role, order.status).length > 0;
}

export function canListManagedTasks(role: Role | null | undefined) {
  return (
    role === ROLES.OVERLORD ||
    role === ROLES.COMPANY_ADMIN ||
    role === ROLES.DISPATCHER ||
    role === ROLES.WAREHOUSE_MANAGER
  );
}

export function canCreateTasks(role: Role | null | undefined) {
  return (
    role === ROLES.OVERLORD ||
    role === ROLES.COMPANY_ADMIN ||
    role === ROLES.DISPATCHER ||
    role === ROLES.WAREHOUSE_MANAGER
  );
}

const WAREHOUSE_SIDE_TASK_TYPES = ['PICKING', 'PACKING', 'LOADING', 'UNLOADING', 'COUNTING', 'STOCK_MOVEMENT'];

function isWarehouseSideTask(task: TaskResponse) {
  return WAREHOUSE_SIDE_TASK_TYPES.includes(task.taskType);
}

export function canMutateManagedTask(role: Role | null | undefined, task: TaskResponse | null | undefined) {
  if (task == null || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return false;
  }

  if (role === ROLES.OVERLORD || role === ROLES.DISPATCHER) {
    return true;
  }

  return role === ROLES.WAREHOUSE_MANAGER && isWarehouseSideTask(task);
}

export function getAllowedTaskStatusTransitions(
  role: Role | null | undefined,
  task: TaskResponse | null | undefined,
): TaskStatus[] {
  if (task == null) {
    return [];
  }

  const canExecute =
    role === ROLES.OVERLORD ||
    role === ROLES.COMPANY_ADMIN ||
    role === ROLES.DISPATCHER ||
    role === ROLES.WAREHOUSE_MANAGER ||
    role === ROLES.DRIVER ||
    role === ROLES.WORKER;

  if (!canExecute) {
    return [];
  }

  if (role === ROLES.WAREHOUSE_MANAGER && !isWarehouseSideTask(task)) {
    return [];
  }

  if (role === ROLES.WORKER && !isWarehouseSideTask(task)) {
    return [];
  }

  if (role === ROLES.DRIVER && task.taskType !== 'DRIVING') {
    return [];
  }

  if (role === ROLES.DRIVER || role === ROLES.WORKER) {
    return appConfig.statusTransitions.task[task.status].filter((status) =>
      status === 'IN_PROGRESS' || status === 'BLOCKED' || status === 'COMPLETED',
    );
  }

  return [...appConfig.statusTransitions.task[task.status]];
}

export function canChangeTaskStatus(role: Role | null | undefined, task: TaskResponse | null | undefined) {
  return getAllowedTaskStatusTransitions(role, task).length > 0;
}


export function canReadVehicleStatusTransitions(role: Role | null | undefined) {
  return (
    role === ROLES.OVERLORD ||
    role === ROLES.COMPANY_ADMIN ||
    role === ROLES.DISPATCHER ||
    role === ROLES.WAREHOUSE_MANAGER
  );
}

export function getAllowedVehicleStatusTransitions(
  role: Role | null | undefined,
  vehicle: VehicleResponse | null | undefined,
): VehicleStatus[] {
  if (vehicle == null || vehicle.active === false) {
    return [];
  }

  if (role === ROLES.OVERLORD || role === ROLES.COMPANY_ADMIN) {
    if (vehicle.status === 'OUT_OF_SERVICE') return ['AVAILABLE', 'MAINTENANCE'];
    if (vehicle.status === 'MAINTENANCE') return ['AVAILABLE', 'OUT_OF_SERVICE'];
    if (vehicle.status === 'AVAILABLE') return ['RESERVED', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    if (vehicle.status === 'RESERVED') return ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    if (vehicle.status === 'IN_USE') return ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
  }

  if (role === ROLES.DISPATCHER) {
    if (vehicle.status === 'AVAILABLE') return ['RESERVED', 'IN_USE', 'OUT_OF_SERVICE'];
    if (vehicle.status === 'RESERVED') return ['AVAILABLE', 'IN_USE', 'OUT_OF_SERVICE'];
    if (vehicle.status === 'IN_USE') return ['AVAILABLE', 'OUT_OF_SERVICE'];
    if (vehicle.status === 'OUT_OF_SERVICE') return ['AVAILABLE'];
  }

  if (role === ROLES.WAREHOUSE_MANAGER) {
    return vehicle.status === 'MAINTENANCE' ? ['AVAILABLE'] : ['MAINTENANCE'];
  }

  return [];
}

export function canChangeVehicleStatus(role: Role | null | undefined, vehicle: VehicleResponse | null | undefined) {
  return getAllowedVehicleStatusTransitions(role, vehicle).length > 0;
}

export function canApproveStockMovementLifecycle(role: Role | null | undefined) {
  return role === ROLES.OVERLORD || role === ROLES.COMPANY_ADMIN || role === ROLES.WAREHOUSE_MANAGER;
}

export function canExecuteStockMovementLifecycle(role: Role | null | undefined) {
  return role === ROLES.OVERLORD || role === ROLES.COMPANY_ADMIN || role === ROLES.WAREHOUSE_MANAGER || role === ROLES.DISPATCHER;
}

export function canReadStockMovementLifecycle(role: Role | null | undefined) {
  return canApproveStockMovementLifecycle(role) || canExecuteStockMovementLifecycle(role) || role === ROLES.WORKER;
}

export function getAllowedStockMovementLifecycleStatuses(
  role: Role | null | undefined,
  movement: StockMovementResponse | null | undefined,
): StockMovementStatus[] {
  if (movement == null) {
    return [];
  }

  const approvalTargets: StockMovementStatus[] = canApproveStockMovementLifecycle(role) ? ['APPROVED', 'REJECTED'] : [];
  const executionTargets: StockMovementStatus[] = canExecuteStockMovementLifecycle(role) ? ['EXECUTED', 'CANCELLED', 'REVERSED'] : [];
  return uniqueStatuses([...approvalTargets, ...executionTargets]);
}

export function canManageInventoryCountLifecycle(role: Role | null | undefined) {
  return role === ROLES.OVERLORD || role === ROLES.COMPANY_ADMIN || role === ROLES.WAREHOUSE_MANAGER;
}

export function canCountInventoryCountLines(role: Role | null | undefined) {
  return canManageInventoryCountLifecycle(role) || role === ROLES.WORKER;
}

export function getAllowedInventoryCountLifecycleStatuses(role: Role | null | undefined) {
  if (!canManageInventoryCountLifecycle(role)) {
    return [] as InventoryCountSessionStatus[];
  }

  return ['OPEN', 'COUNTING', 'REVIEW', 'APPROVED', 'ADJUSTMENTS_CREATED', 'CLOSED', 'REJECTED', 'CANCELLED'] as InventoryCountSessionStatus[];
}
