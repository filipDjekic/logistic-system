export const queryKeys = {
  auth: {
    root: () => ['auth'] as const,
    me: () => ['auth', 'me'] as const,
    bootstrap: (accessToken: string | null | undefined) =>
      ['auth', 'bootstrap', accessToken ?? null] as const,
  },

  activityLogs: {
    root: () => ['activity-logs'] as const,
    list: (params: unknown) => ['activity-logs', 'list', params] as const,
    detail: (id: number) => ['activity-logs', 'details', id] as const,
    byUser: (userId: number) => ['activity-logs', 'user', userId] as const,
  },

  activityTimeline: {
    root: () => ['activity-timeline'] as const,
    entity: (entityType: unknown, entityId: unknown) => ['activity-timeline', 'entity', entityType, entityId] as const,
    recent: () => ['activity-timeline', 'recent'] as const,
    comments: (entityType: unknown, entityId: unknown) => ['activity-timeline', 'comments', entityType, entityId] as const,
    attachments: (entityType: unknown, entityId: unknown) => ['activity-timeline', 'attachments', entityType, entityId] as const,
  },

  changeHistory: {
    root: () => ['change-history'] as const,
    list: (params: unknown) => ['change-history', 'list', params] as const,
    detail: (id: number) => ['change-history', 'details', id] as const,
  },

  companies: {
    root: () => ['companies'] as const,
    all: () => ['companies', 'all'] as const,
    detail: (id: number) => ['companies', 'details', id] as const,
  },

  dashboard: {
    root: () => ['dashboard'] as const,
    role: (role: string) => ['dashboard', role] as const,
    myTasks: () => ['dashboard', 'my-tasks'] as const,
    myUnreadNotificationsCount: () => ['dashboard', 'my-unread-notifications-count'] as const,
    transportOrders: () => ['dashboard', 'transport-orders'] as const,
    vehicles: () => ['dashboard', 'vehicles'] as const,
    warehouses: () => ['dashboard', 'warehouses'] as const,
    warehouseInventory: (warehouseId: number) => ['dashboard', 'warehouse-inventory', warehouseId] as const,
    lifecycleMonitoring: () => ['dashboard', 'lifecycle-monitoring'] as const,
    operational: (role?: string | null) => ['dashboard', 'operational', role ?? null] as const,
  },

  employees: {
    root: () => ['employees'] as const,
    all: () => ['employees', 'all'] as const,
    list: (params: unknown) => ['employees', 'list', params] as const,
    detail: (id: number) => ['employees', 'details', id] as const,
    tasks: (id: number) => ['employees', 'details', id, 'tasks'] as const,
    shifts: (id: number) => ['employees', 'details', id, 'shifts'] as const,
  },

  inventory: {
    root: () => ['inventory'] as const,
    list: (filters: unknown) => ['inventory', 'list', filters] as const,
    detail: (warehouseId: number, productId: number) => ['inventory', 'details', warehouseId, productId] as const,
    warehouses: () => ['inventory', 'warehouses'] as const,
    products: () => ['inventory', 'products'] as const,
    statusCounts: (filters: unknown) => ['inventory', 'status-counts', filters] as const,
  },

  notifications: {
    root: () => ['notifications'] as const,
    my: (params: unknown) => ['notifications', 'my', params] as const,
    myUnreadCount: () => ['notifications', 'my', 'unread-count'] as const,
  },

  products: {
    root: () => ['products'] as const,
    all: () => ['products', 'all'] as const,
    detail: (id: number) => ['products', 'details', id] as const,
  },

  roles: {
    root: () => ['roles'] as const,
    all: () => ['roles', 'all'] as const,
    detail: (id: number) => ['roles', 'details', id] as const,
  },

  shifts: {
    root: () => ['shifts'] as const,
    all: () => ['shifts', 'all'] as const,
    list: (params: unknown) => ['shifts', 'list', params] as const,
    my: () => ['shifts', 'my'] as const,
    detail: (id: number) => ['shifts', 'details', id] as const,
  },

  stockMovements: {
    root: () => ['stock-movements'] as const,
    list: (params: unknown) => ['stock-movements', 'list', params] as const,
    detail: (id: number) => ['stock-movements', 'details', id] as const,
    trace: (id: number) => ['stock-movements', 'trace', id] as const,
    operationWarehouseSearch: (search: string) => ['stock-operation', 'warehouse-search', search] as const,
    operationProductSearch: (search: string) => ['stock-operation', 'product-search', search] as const,
    operationTransportOrderSearch: (search: string) => ['stock-operation', 'transport-order-search', search] as const,
    operationWarehouseInventory: (warehouseId: number | null | undefined) => ['stock-operation-warehouse-inventory', warehouseId ?? null] as const,
  },

  tasks: {
    root: () => ['tasks'] as const,
    all: (params?: unknown) => ['tasks', 'all', params ?? {}] as const,
    my: (params?: unknown) => ['tasks', 'my', params ?? {}] as const,
    detail: (id: number) => ['tasks', 'details', id] as const,
    employees: () => ['tasks', 'employees'] as const,
    transportOrders: () => ['tasks', 'transport-orders'] as const,
    stockMovements: () => ['tasks', 'stock-movements'] as const,
    detailEmployee: (employeeId: number | null | undefined) => ['task-details', 'employee', employeeId ?? null] as const,
    detailTransportOrder: (transportOrderId: number | null | undefined) => ['task-details', 'transport-order', transportOrderId ?? null] as const,
    detailStockMovement: (stockMovementId: number | null | undefined) => ['task-details', 'stock-movement', stockMovementId ?? null] as const,
    statusCounts: (params?: unknown) => ['tasks', 'status-counts', params ?? {}] as const,
  },

  transportOrders: {
    root: () => ['transport-orders'] as const,
    all: () => ['transport-orders', 'all'] as const,
    list: (params: unknown) => ['transport-orders', 'list', params] as const,
    detail: (id: number) => ['transport-orders', 'details', id] as const,
    items: (transportOrderId: number) => ['transport-order-items', transportOrderId] as const,
    transportOrderItemsRoot: () => ['transport-order-items'] as const,
    warehouses: () => ['transport-orders', 'warehouses'] as const,
    vehicles: () => ['transport-orders', 'vehicles'] as const,
    employees: () => ['transport-orders', 'employees'] as const,
    products: () => ['transport-orders', 'products'] as const,
    statusCounts: (params: unknown) => ['transport-orders', 'status-counts', params] as const,
  },

  users: {
    root: () => ['users'] as const,
    all: () => ['users', 'all'] as const,
    detail: (id: number) => ['users', 'details', id] as const,
  },

  vehicles: {
    root: () => ['vehicles'] as const,
    all: (params?: unknown) => ['vehicles', 'all', params ?? {}] as const,
    detail: (id: number) => ['vehicles', 'details', id] as const,
    statusCounts: (params?: unknown) => ['vehicles', 'status-counts', params ?? {}] as const,
  },

  vehicleMaintenance: {
    root: () => ['vehicle-maintenance'] as const,
    list: (params?: unknown) => ['vehicle-maintenance', 'list', params ?? {}] as const,
  },

  warehouses: {
    root: () => ['warehouses'] as const,
    all: (params?: unknown) => ['warehouses', 'all', params ?? {}] as const,
    managers: () => ['warehouses', 'managers'] as const,
    detail: (id: number) => ['warehouses', 'details', id] as const,
  },
  
  cities: {
    root: () => ['cities'] as const,
    all: () => ['cities', 'all'] as const,
    byCountry: (countryId: number | null) => ['cities', 'country', countryId] as const,
    detail: (id: number) => ['cities', 'details', id] as const,
  },
  
  countries: {
    root: () => ['countries'] as const,
    all: () => ['countries', 'all'] as const,
    active: () => ['countries', 'active'] as const,
    detail: (id: number) => ['countries', 'details', id] as const,
  },

  companyRegistrationRequests: {
    root: () => ['company-registration-requests'] as const,
    list: (status: unknown) => ['company-registration-requests', 'list', status] as const,
    publicStatus: (id: number) => ['company-registration-requests', 'public-status', id] as const,
  },

  employeeWarehouseAssignments: {
    root: () => ['employee-warehouse-assignments'] as const,
    byEmployee: (employeeId: number | null) => ['employee-warehouse-assignments', 'employee', employeeId] as const,
    byWarehouse: (warehouseId: number | null) => ['employee-warehouse-assignments', 'warehouse', warehouseId] as const,
  },

  timezones: {
    root: () => ['timezones'] as const,
    active: () => ['timezones', 'active'] as const,
    byCountry: (countryId: number | null) => ['timezones', 'country', countryId] as const,
    detail: (id: number) => ['timezones', 'details', id] as const,
  },
} as const;
