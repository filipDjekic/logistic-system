export type AppRouteMeta = {
  path: string;
  title: string;
  breadcrumb: string;
  parent?: string;
};

export const routeMeta = {
  starter: { path: '/', title: 'Welcome', breadcrumb: 'Welcome' },
  login: { path: '/login', title: 'Login', breadcrumb: 'Login' },
  dashboard: { path: '/dashboard', title: 'Dashboard', breadcrumb: 'Dashboard' },
  notifications: { path: '/notifications', title: 'Notifications', breadcrumb: 'Notifications' },
  profile: { path: '/profile', title: 'My Profile', breadcrumb: 'My Profile' },
  companyRegistration: { path: '/register-company', title: 'Register Company', breadcrumb: 'Register Company' },
  companyRegistrationRequests: { path: '/company-registration-requests', title: 'Company Registration Requests', breadcrumb: 'Company Registration Requests' },
  companies: { path: '/companies', title: 'Companies', breadcrumb: 'Companies' },
  companyDetails: { path: '/companies/:id', title: 'Company Details', breadcrumb: 'Company Details', parent: 'companies' },
  shifts: { path: '/shifts', title: 'Shifts', breadcrumb: 'Shifts' },
  shiftDetails: { path: '/shifts/:id', title: 'Shift Details', breadcrumb: 'Shift Details', parent: 'shifts' },
  myShifts: { path: '/my-shifts', title: 'My Shifts', breadcrumb: 'My Shifts' },
  transportOrders: { path: '/transport-orders', title: 'Transport Orders', breadcrumb: 'Transport Orders' },
  transportOrderDetails: { path: '/transport-orders/:id', title: 'Transport Order Details', breadcrumb: 'Transport Order Details', parent: 'transportOrders' },
  vehicles: { path: '/vehicles', title: 'Vehicles', breadcrumb: 'Vehicles' },
  vehicleDetails: { path: '/vehicles/:id', title: 'Vehicle Details', breadcrumb: 'Vehicle Details', parent: 'vehicles' },
  warehouses: { path: '/warehouses', title: 'Warehouses', breadcrumb: 'Warehouses' },
  warehouseDetails: { path: '/warehouses/:id', title: 'Warehouse Details', breadcrumb: 'Warehouse Details', parent: 'warehouses' },
  warehouseZoneDetails: { path: '/warehouses/:warehouseId/zones/:zoneId', title: 'Zone Details', breadcrumb: 'Zone', parent: 'warehouseDetails' },
  warehouseBinDetails: { path: '/warehouses/:warehouseId/zones/:zoneId/bins/:binId', title: 'Bin Details', breadcrumb: 'Bin', parent: 'warehouseZoneDetails' },
  products: { path: '/products', title: 'Products', breadcrumb: 'Products' },
  productDetails: { path: '/products/:id', title: 'Product Details', breadcrumb: 'Product Details', parent: 'products' },
  inventory: { path: '/inventory', title: 'Inventory', breadcrumb: 'Inventory' },
  inventoryDetails: { path: '/inventory/:warehouseId/:productId', title: 'Inventory Details', breadcrumb: 'Inventory Details', parent: 'inventory' },
  stockMovements: { path: '/stock-movements', title: 'Stock Movements', breadcrumb: 'Stock Movements' },
  inventoryCounts: { path: '/inventory-counts', title: 'Inventory Counts', breadcrumb: 'Inventory Counts' },
  inventoryCountDetails: { path: '/inventory-counts/:id', title: 'Inventory Count Details', breadcrumb: 'Inventory Count Details', parent: 'inventoryCounts' },
  stockMovementDetails: { path: '/stock-movements/:id', title: 'Stock Movement Details', breadcrumb: 'Stock Movement Details', parent: 'stockMovements' },
  stockInbound: { path: '/stock/inbound', title: 'Inbound Stock', breadcrumb: 'Inbound Stock', parent: 'stockMovements' },
  stockOutbound: { path: '/stock/outbound', title: 'Outbound Stock', breadcrumb: 'Outbound Stock', parent: 'stockMovements' },
  stockTransfer: { path: '/stock/transfer', title: 'Transfer Stock', breadcrumb: 'Transfer Stock', parent: 'stockMovements' },
  stockAdjustment: { path: '/stock/adjustment', title: 'Adjust Stock', breadcrumb: 'Adjust Stock', parent: 'stockMovements' },
  stockWriteOff: { path: '/stock/write-off', title: 'Write Off Stock', breadcrumb: 'Write Off Stock', parent: 'stockMovements' },
  stockReturn: { path: '/stock/return', title: 'Return Stock', breadcrumb: 'Return Stock', parent: 'stockMovements' },
  tasks: { path: '/tasks', title: 'Tasks', breadcrumb: 'Tasks' },
  taskDetails: { path: '/tasks/:id', title: 'Task Details', breadcrumb: 'Task Details', parent: 'tasks' },
  taskCreate: { path: '/tasks/create', title: 'Create Task', breadcrumb: 'Create Task', parent: 'tasks' },
  taskEdit: { path: '/tasks/:id/edit', title: 'Edit Task', breadcrumb: 'Edit Task', parent: 'tasks' },
  transportOrderCreate: { path: '/transport-orders/create', title: 'Create Transport Order', breadcrumb: 'Create Transport Order', parent: 'transportOrders' },
  transportOrderEdit: { path: '/transport-orders/:id/edit', title: 'Edit Transport Order', breadcrumb: 'Edit Transport Order', parent: 'transportOrders' },
  transportReport: { path: '/reports/transport', title: 'Transport Report', breadcrumb: 'Transport Report' },
  inventoryReport: { path: '/reports/inventory', title: 'Inventory Report', breadcrumb: 'Inventory Report' },
  employeeTaskReport: { path: '/reports/employee-tasks', title: 'Employee / Task Report', breadcrumb: 'Employee / Task Report' },
  roles: { path: '/roles', title: 'Roles', breadcrumb: 'Roles' },
  roleDetails: { path: '/roles/:id', title: 'Role Details', breadcrumb: 'Role Details', parent: 'roles' },
  employees: { path: '/employees', title: 'Employees', breadcrumb: 'Employees' },
  employeeDetails: { path: '/employees/:id', title: 'Employee Details', breadcrumb: 'Employee Details', parent: 'employees' },
  users: { path: '/users', title: 'Users', breadcrumb: 'Users' },
  userDetails: { path: '/users/:id', title: 'User Details', breadcrumb: 'User Details', parent: 'users' },
  activityLogs: { path: '/activity-logs', title: 'Activity Logs', breadcrumb: 'Activity Logs' },
  activityTimeline: { path: '/activity-timeline', title: 'Activity Timeline', breadcrumb: 'Activity Timeline' },
  changeHistory: { path: '/change-history', title: 'Change History', breadcrumb: 'Change History' },
} satisfies Record<string, AppRouteMeta>;

type RouteMetaKey = keyof typeof routeMeta;

function withDynamicLabel(meta: AppRouteMeta, pathname: string): AppRouteMeta {
  const lastSegment = pathname.split('/').filter(Boolean).at(-1);

  if (!lastSegment || Number.isNaN(Number(lastSegment))) {
    return meta;
  }

  return {
    ...meta,
    breadcrumb: `${meta.breadcrumb} #${lastSegment}`,
  };
}

export function getRouteMetaByPath(pathname: string): AppRouteMeta | null {
  const dynamicMatches: Array<[RegExp, RouteMetaKey]> = [
    [/^\/companies\/\d+$/, 'companyDetails'],
    [/^\/transport-orders\/\d+$/, 'transportOrderDetails'],
    [/^\/transport-orders\/create$/, 'transportOrderCreate'],
    [/^\/transport-orders\/\d+\/edit$/, 'transportOrderEdit'],
    [/^\/vehicles\/\d+$/, 'vehicleDetails'],
    [/^\/inventory\/\d+\/\d+$/, 'inventoryDetails'],
    [/^\/warehouses\/\d+$/, 'warehouseDetails'],
    [/^\/warehouses\/\d+\/zones\/\d+$/, 'warehouseZoneDetails'],
    [/^\/warehouses\/\d+\/zones\/\d+\/bins\/\d+$/, 'warehouseBinDetails'],
    [/^\/products\/\d+$/, 'productDetails'],
    [/^\/tasks\/\d+$/, 'taskDetails'],
    [/^\/shifts\/\d+$/, 'shiftDetails'],
    [/^\/tasks\/create$/, 'taskCreate'],
    [/^\/tasks\/\d+\/edit$/, 'taskEdit'],
    [/^\/employees\/\d+$/, 'employeeDetails'],
    [/^\/users\/\d+$/, 'userDetails'],
    [/^\/roles\/\d+$/, 'roleDetails'],
    [/^\/stock-movements\/\d+$/, 'stockMovementDetails'],
    [/^\/inventory-counts\/\d+$/, 'inventoryCountDetails'],
  ];

  const dynamicMatch = dynamicMatches.find(([pattern]) => pattern.test(pathname));
  if (dynamicMatch) {
    return withDynamicLabel(routeMeta[dynamicMatch[1]], pathname) as AppRouteMeta;
  }

  const entries = Object.values(routeMeta) as AppRouteMeta[];
  return entries.find((item) => item.path === pathname) ?? null;
}

export function buildBreadcrumbTrail(pathname: string): AppRouteMeta[] {
  const warehouseBinMatch = pathname.match(/^\/warehouses\/(\d+)\/zones\/(\d+)\/bins\/(\d+)$/);
  if (warehouseBinMatch) {
    const [, warehouseId, zoneId, binId] = warehouseBinMatch;
    return [
      routeMeta.dashboard as AppRouteMeta,
      routeMeta.warehouses as AppRouteMeta,
      { ...routeMeta.warehouseDetails, path: `/warehouses/${warehouseId}`, breadcrumb: `Warehouse #${warehouseId}` },
      { ...routeMeta.warehouseZoneDetails, path: `/warehouses/${warehouseId}/zones/${zoneId}`, breadcrumb: `Zone #${zoneId}` },
      { ...routeMeta.warehouseBinDetails, path: pathname, breadcrumb: `Bin #${binId}` },
    ];
  }

  const warehouseZoneMatch = pathname.match(/^\/warehouses\/(\d+)\/zones\/(\d+)$/);
  if (warehouseZoneMatch) {
    const [, warehouseId, zoneId] = warehouseZoneMatch;
    return [
      routeMeta.dashboard as AppRouteMeta,
      routeMeta.warehouses as AppRouteMeta,
      { ...routeMeta.warehouseDetails, path: `/warehouses/${warehouseId}`, breadcrumb: `Warehouse #${warehouseId}` },
      { ...routeMeta.warehouseZoneDetails, path: pathname, breadcrumb: `Zone #${zoneId}` },
    ];
  }

  const warehouseZonesMatch = pathname.match(/^\/warehouses\/(\d+)\/zones$/);
  if (warehouseZonesMatch) {
    const [, warehouseId] = warehouseZonesMatch;
    return [
      routeMeta.dashboard as AppRouteMeta,
      routeMeta.warehouses as AppRouteMeta,
      { ...routeMeta.warehouseDetails, path: `/warehouses/${warehouseId}`, breadcrumb: `Warehouse #${warehouseId}` },
    ];
  }

  const currentMeta = getRouteMetaByPath(pathname);
  if (!currentMeta) {
    return [];
  }

  const trail: AppRouteMeta[] = [];
  let cursor: AppRouteMeta | undefined = currentMeta;

  while (cursor) {
    trail.unshift(cursor);
    const parentKey = cursor.parent as RouteMetaKey | undefined;
    cursor = parentKey ? routeMeta[parentKey] as AppRouteMeta : undefined;
  }

  if (trail[0]?.path !== routeMeta.dashboard.path && currentMeta.path !== routeMeta.dashboard.path) {
    trail.unshift(routeMeta.dashboard as AppRouteMeta);
  }

  return trail;
}
