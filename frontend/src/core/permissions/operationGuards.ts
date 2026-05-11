import { appConfig } from '../config/appConfig';
import { ROLES, type Role } from '../constants/roles';
import type { TaskResponse, TaskStatus } from '../../features/tasks/types/task.types';
import type { TransportOrderResponse, TransportOrderStatus } from '../../features/transport-orders/types/transportOrder.types';

export function canManageTransportOrders(role: Role | null | undefined) {
  return role === ROLES.OVERLORD || role === ROLES.DISPATCHER;
}

export function canEditTransportOrder(role: Role | null | undefined, order: TransportOrderResponse | null | undefined) {
  return canManageTransportOrders(role) && order != null && (order.status === 'CREATED' || order.status === 'DRAFT');
}

export function canMutateTransportOrderItems(role: Role | null | undefined, order: TransportOrderResponse | null | undefined) {
  return canManageTransportOrders(role) && order != null && (order.status === 'CREATED' || order.status === 'DRAFT');
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

  if (!canManageTransportOrders(role)) {
    return [];
  }

  return [...appConfig.statusTransitions.transportOrder[status]];
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

export function canMutateManagedTask(role: Role | null | undefined, task: TaskResponse | null | undefined) {
  if (task == null || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return false;
  }

  if (role === ROLES.OVERLORD || role === ROLES.DISPATCHER) {
    return true;
  }

  return role === ROLES.WAREHOUSE_MANAGER && task.transportOrderId == null;
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
    role === ROLES.DISPATCHER ||
    role === ROLES.WAREHOUSE_MANAGER ||
    role === ROLES.WORKER;

  if (!canExecute) {
    return [];
  }

  if (role === ROLES.WAREHOUSE_MANAGER && task.transportOrderId != null) {
    return [];
  }


  if (role === ROLES.WORKER && task.stockMovementId == null && task.transportOrderId != null) {
    return [];
  }

  return [...appConfig.statusTransitions.task[task.status]];
}

export function canChangeTaskStatus(role: Role | null | undefined, task: TaskResponse | null | undefined) {
  return getAllowedTaskStatusTransitions(role, task).length > 0;
}
