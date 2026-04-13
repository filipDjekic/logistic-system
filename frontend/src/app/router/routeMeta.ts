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
  companies: {
    path: '/companies',
    title: 'Companies',
    breadcrumb: 'Companies',
  },
  companyDetails: {
    path: '/companies/:id',
    title: 'Company Details',
    breadcrumb: 'Company Details',
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
  warehouses: {
    path: '/warehouses',
    title: 'Warehouses',
    breadcrumb: 'Warehouses',
  },
  warehouseDetails: {
    path: '/warehouses/:id',
    title: 'Warehouse Details',
    breadcrumb: 'Warehouse Details',
  },
  products: {
    path: '/products',
    title: 'Products',
    breadcrumb: 'Products',
  },
  productDetails: {
    path: '/products/:id',
    title: 'Product Details',
    breadcrumb: 'Product Details',
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
  tasks: {
    path: '/tasks',
    title: 'Tasks',
    breadcrumb: 'Tasks',
  },
  taskDetails: {
    path: '/tasks/:id',
    title: 'Task Details',
    breadcrumb: 'Task Details',
  },
  roles: {
    path: '/roles',
    title: 'Roles',
    breadcrumb: 'Roles',
  },
  roleDetails: {
    path: '/roles/:id',
    title: 'Role Details',
    breadcrumb: 'Role Details',
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
  users: {
    path: '/users',
    title: 'Users',
    breadcrumb: 'Users',
  },
  userDetails: {
    path: '/users/:id',
    title: 'User Details',
    breadcrumb: 'User Details',
  },
  activityLogs: {
    path: '/activity-logs',
    title: 'Activity Logs',
    breadcrumb: 'Activity Logs',
  },
  changeHistory: {
    path: '/change-history',
    title: 'Change History',
    breadcrumb: 'Change History',
  },
} satisfies Record<string, AppRouteMeta>;

export function getRouteMetaByPath(pathname: string): AppRouteMeta | null {
  if (/^\/companies\/\d+$/.test(pathname)) {
    return routeMeta.companyDetails;
  }

  if (/^\/transport-orders\/\d+$/.test(pathname)) {
    return routeMeta.transportOrderDetails;
  }

  if (/^\/vehicles\/\d+$/.test(pathname)) {
    return routeMeta.vehicleDetails;
  }

  if (/^\/inventory\/\d+\/\d+$/.test(pathname)) {
    return routeMeta.inventoryDetails;
  }

  if (/^\/warehouses\/\d+$/.test(pathname)) {
    return routeMeta.warehouseDetails;
  }

  if (/^\/products\/\d+$/.test(pathname)) {
    return routeMeta.productDetails;
  }

  if (/^\/tasks\/\d+$/.test(pathname)) {
    return routeMeta.taskDetails;
  }

  if (/^\/employees\/\d+$/.test(pathname)) {
    return routeMeta.employeeDetails;
  }

  if (/^\/users\/\d+$/.test(pathname)) {
    return routeMeta.userDetails;
  }

  if (/^\/roles\/\d+$/.test(pathname)) {
    return routeMeta.roleDetails;
  }

  const entries = Object.values(routeMeta);
  return entries.find((item) => item.path === pathname) ?? null;
}