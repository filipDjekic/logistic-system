import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import {
  dashboardApi,
  type TaskResponse,
  type TaskStatus,
  type TransportOrderResponse,
  type TransportOrderStatus,
  type VehicleResponse,
  type VehicleStatus,
  type WarehouseInventoryResponse,
  type WarehouseResponse,
} from '../api/dashboardApi';

type InventoryAlertItem = {
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  minStockLevel: number;
  availableQuantity: number;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (value == null || value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildCountMap<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

export function useDashboardData() {
  const auth = useAuthStore();
  const role = auth.user?.role ?? null;
  const isAdmin = role === ROLES.OVERLORD || role === ROLES.COMPANY_ADMIN;

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'my-tasks'],
        queryFn: dashboardApi.getMyTasks,
      },
      {
        queryKey: ['dashboard', 'my-unread-notifications-count'],
        queryFn: dashboardApi.getMyUnreadNotificationsCount,
      },
      {
        queryKey: ['dashboard', 'transport-orders'],
        queryFn: dashboardApi.getTransportOrders,
        enabled: isAdmin,
      },
      {
        queryKey: ['dashboard', 'vehicles'],
        queryFn: dashboardApi.getVehicles,
        enabled: isAdmin,
      },
      {
        queryKey: ['dashboard', 'warehouses'],
        queryFn: dashboardApi.getWarehouses,
        enabled: isAdmin,
      },
    ],
  });

  const [
    myTasksQuery,
    unreadNotificationsCountQuery,
    transportOrdersQuery,
    vehiclesQuery,
    warehousesQuery,
  ] = results;

  const warehouses = (warehousesQuery.data ?? []) as WarehouseResponse[];

  const inventoryQueries = useQueries({
    queries: warehouses.map((warehouse) => ({
      queryKey: ['dashboard', 'warehouse-inventory', warehouse.id],
      queryFn: () => dashboardApi.getWarehouseInventory(warehouse.id),
      enabled: isAdmin,
    })),
  });

  const isLoading =
    myTasksQuery.isLoading ||
    unreadNotificationsCountQuery.isLoading ||
    (isAdmin &&
      (transportOrdersQuery.isLoading ||
        vehiclesQuery.isLoading ||
        warehousesQuery.isLoading ||
        inventoryQueries.some((query) => query.isLoading)));

  const isError =
    myTasksQuery.isError ||
    unreadNotificationsCountQuery.isError ||
    (isAdmin &&
      (transportOrdersQuery.isError ||
        vehiclesQuery.isError ||
        warehousesQuery.isError ||
        inventoryQueries.some((query) => query.isError)));

  const refetch = async () => {
    await Promise.all([
      myTasksQuery.refetch(),
      unreadNotificationsCountQuery.refetch(),
      ...(isAdmin
        ? [
            transportOrdersQuery.refetch(),
            vehiclesQuery.refetch(),
            warehousesQuery.refetch(),
            ...inventoryQueries.map((query) => query.refetch()),
          ]
        : []),
    ]);
  };

  const myTasks = (myTasksQuery.data ?? []) as TaskResponse[];
  const unreadNotificationsCount = unreadNotificationsCountQuery.data ?? 0;
  const transportOrders = (transportOrdersQuery.data ?? []) as TransportOrderResponse[];
  const vehicles = (vehiclesQuery.data ?? []) as VehicleResponse[];
  const inventoryLists = inventoryQueries.map(
    (query) => (query.data ?? []) as WarehouseInventoryResponse[],
  );

  const taskStatusCounts = useMemo(() => {
    return buildCountMap(myTasks.map((task) => task.status as TaskStatus));
  }, [myTasks]);

  const transportStatusCounts = useMemo(() => {
    return buildCountMap(
      transportOrders.map((transport) => transport.status as TransportOrderStatus),
    );
  }, [transportOrders]);

  const vehicleStatusCounts = useMemo(() => {
    return buildCountMap(vehicles.map((vehicle) => vehicle.status as VehicleStatus));
  }, [vehicles]);

  const inventoryAlerts = useMemo<InventoryAlertItem[]>(() => {
    return inventoryLists
      .flat()
      .map((item) => {
        const quantity = toNumber(item.quantity);
        const reservedQuantity = toNumber(item.reservedQuantity);
        const minStockLevel = toNumber(item.minStockLevel);
        const availableQuantity = quantity - reservedQuantity;

        return {
          warehouseId: item.warehouseId,
          productId: item.productId,
          quantity,
          reservedQuantity,
          minStockLevel,
          availableQuantity,
        };
      })
      .filter((item) => item.availableQuantity <= item.minStockLevel)
      .sort((a, b) => a.availableQuantity - b.availableQuantity);
  }, [inventoryLists]);

    const [now] = useState(() => Date.now());

    const overdueTasksCount = useMemo(() => {
        return myTasks.filter((task) => {
        if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
            return false;
        }

        return new Date(task.dueDate).getTime() < now;
        }).length;
    }, [myTasks, now]);

  return {
    role,
    isAdmin,
    isLoading,
    isError,
    refetch,

    myTasks,
    unreadNotificationsCount,
    transportOrders,
    vehicles,
    warehouses,
    inventoryAlerts,

    taskStatusCounts,
    transportStatusCounts,
    vehicleStatusCounts,
    overdueTasksCount,

    stats: {
      myTasksTotal: myTasks.length,
      myTasksOpen:
        (taskStatusCounts.NEW ?? 0) + (taskStatusCounts.IN_PROGRESS ?? 0),
      myTasksCompleted: taskStatusCounts.COMPLETED ?? 0,
      overdueTasksCount,
      unreadNotificationsCount,
      transportOrdersTotal: transportOrders.length,
      vehiclesTotal: vehicles.length,
      vehiclesInUse: vehicleStatusCounts.IN_USE ?? 0,
      inventoryAlertsCount: inventoryAlerts.length,
    },
  };
}