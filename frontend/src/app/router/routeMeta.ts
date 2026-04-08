export type AppRouteMeta = {
  path: string;
  title: string;
  breadcrumb: string;
};

export const routeMeta = {
  starter: {
    path: '/',
    title: 'Welcome',
    breadcrumb: 'Welcome',
  },
  login: {
    path: '/login',
    title: 'Login',
    breadcrumb: 'Login',
  },
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    breadcrumb: 'Dashboard',
  },
  notifications: {
    path: '/notifications',
    title: 'Notifications',
    breadcrumb: 'Notifications',
  },
  shifts: {
    path: '/shifts',
    title: 'Shifts',
    breadcrumb: 'Shifts',
  },
  myShifts: {
    path: '/my-shifts',
    title: 'My Shifts',
    breadcrumb: 'My Shifts',
  },
  transportOrders: {
    path: '/transport-orders',
    title: 'Transport Orders',
    breadcrumb: 'Transport Orders',
  },
  transportOrderDetails: {
    path: '/transport-orders/:id',
    title: 'Transport Order Details',
    breadcrumb: 'Transport Order Details',
  },
  vehicles: {
    path: '/vehicles',
    title: 'Vehicles',
    breadcrumb: 'Vehicles',
  },
  vehicleDetails: {
    path: '/vehicles/:id',
    title: 'Vehicle Details',
    breadcrumb: 'Vehicle Details',
  },
    inventory: {
    path: '/inventory',
    title: 'Inventory',
    breadcrumb: 'Inventory',
  },
  inventoryDetails: {
    path: '/inventory/:warehouseId/:productId',
    title: 'Inventory Details',
    breadcrumb: 'Inventory Details',
  },
  stockMovements: {
  path: '/stock-movements',
  title: 'Stock Movements',
  breadcrumb: 'Stock Movements',
  },
    employees: {
    path: '/employees',
    title: 'Employees',
    breadcrumb: 'Employees',
  },
  employeeDetails: {
    path: '/employees/:id',
    title: 'Employee Details',
    breadcrumb: 'Employee Details',
  },
} satisfies Record<string, AppRouteMeta>;

export function getRouteMetaByPath(pathname: string): AppRouteMeta | null {
  if (/^\/transport-orders\/\d+$/.test(pathname)) {
    return routeMeta.transportOrderDetails;
  }

  if (/^\/vehicles\/\d+$/.test(pathname)) {
    return routeMeta.vehicleDetails;
  }

  if (/^\/inventory\/\d+\/\d+$/.test(pathname)) {
    return routeMeta.inventoryDetails;
  }

  if (/^\/employees\/\d+$/.test(pathname)) {
    return routeMeta.employeeDetails;
  }

  const entries = Object.values(routeMeta);
  return entries.find((item) => item.path === pathname) ?? null;
}