import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';

function invalidateRoot(queryClient: QueryClient, queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey, exact: false, refetchType: 'active' });
}

function invalidateDetail(queryClient: QueryClient, queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey, exact: true, refetchType: 'active' });
}

export function invalidateCompanyState(queryClient: QueryClient, companyId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.companies.root()),
    companyId ? invalidateDetail(queryClient, queryKeys.companies.detail(companyId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateEmployeeState(queryClient: QueryClient, employeeId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.employees.root()),
    employeeId ? invalidateDetail(queryClient, queryKeys.employees.detail(employeeId)) : Promise.resolve(),
    employeeId ? invalidateRoot(queryClient, queryKeys.employees.tasks(employeeId)) : Promise.resolve(),
    employeeId ? invalidateRoot(queryClient, queryKeys.employees.shifts(employeeId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.users.root()),
    invalidateRoot(queryClient, queryKeys.roles.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateInventoryState(queryClient: QueryClient, warehouseId?: number, productId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.inventory.root()),
    warehouseId && productId
      ? invalidateDetail(queryClient, queryKeys.inventory.detail(warehouseId, productId))
      : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.stockMovements.root()),
    invalidateRoot(queryClient, queryKeys.warehouses.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateProductState(queryClient: QueryClient, productId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.products.root()),
    productId ? invalidateDetail(queryClient, queryKeys.products.detail(productId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.inventory.root()),
    invalidateRoot(queryClient, queryKeys.stockMovements.root()),
    invalidateRoot(queryClient, queryKeys.transportOrders.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateShiftState(queryClient: QueryClient, shiftId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.shifts.root()),
    shiftId ? invalidateDetail(queryClient, queryKeys.shifts.detail(shiftId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.employees.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateTaskState(queryClient: QueryClient, taskId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.tasks.root()),
    taskId ? invalidateDetail(queryClient, queryKeys.tasks.detail(taskId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
    invalidateRoot(queryClient, queryKeys.employees.root()),
    invalidateRoot(queryClient, queryKeys.transportOrders.root()),
    invalidateRoot(queryClient, queryKeys.stockMovements.root()),
    invalidateRoot(queryClient, queryKeys.notifications.root()),
  ]);
}

export function invalidateTransportOrderState(queryClient: QueryClient, transportOrderId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.transportOrders.root()),
    transportOrderId
      ? invalidateDetail(queryClient, queryKeys.transportOrders.detail(transportOrderId))
      : Promise.resolve(),
    transportOrderId
      ? invalidateRoot(queryClient, queryKeys.transportOrders.items(transportOrderId))
      : invalidateRoot(queryClient, queryKeys.transportOrders.transportOrderItemsRoot()),
    invalidateRoot(queryClient, queryKeys.tasks.root()),
    invalidateRoot(queryClient, queryKeys.vehicles.root()),
    invalidateRoot(queryClient, queryKeys.warehouses.root()),
    invalidateRoot(queryClient, queryKeys.inventory.root()),
    invalidateRoot(queryClient, queryKeys.stockMovements.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
    invalidateRoot(queryClient, queryKeys.notifications.root()),
  ]);
}

export function invalidateUserState(queryClient: QueryClient, userId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.users.root()),
    userId ? invalidateDetail(queryClient, queryKeys.users.detail(userId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.employees.root()),
    invalidateRoot(queryClient, queryKeys.roles.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateVehicleState(queryClient: QueryClient, vehicleId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.vehicles.root()),
    vehicleId ? invalidateDetail(queryClient, queryKeys.vehicles.detail(vehicleId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.transportOrders.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}

export function invalidateWarehouseState(queryClient: QueryClient, warehouseId?: number) {
  return Promise.all([
    invalidateRoot(queryClient, queryKeys.warehouses.root()),
    warehouseId ? invalidateDetail(queryClient, queryKeys.warehouses.detail(warehouseId)) : Promise.resolve(),
    invalidateRoot(queryClient, queryKeys.inventory.root()),
    invalidateRoot(queryClient, queryKeys.stockMovements.root()),
    invalidateRoot(queryClient, queryKeys.transportOrders.root()),
    invalidateRoot(queryClient, queryKeys.dashboard.root()),
  ]);
}
