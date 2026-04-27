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
    myTasks: () => ['dashboard', 'my-tasks'] as const,
    myUnreadNotificationsCount: () => ['dashboard', 'my-unread-notifications-count'] as const,
    transportOrders: () => ['dashboard', 'transport-orders'] as const,
    vehicles: () => ['dashboard', 'vehicles'] as const,
    warehouses: () => ['dashboard', 'warehouses'] as const,
    warehouseInventory: (warehouseId: number) => ['dashboard', 'warehouse-inventory', warehouseId] as const,
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
  },

  notifications: {
    root: () => ['notifications'] as const,
    my: (page: number, size: number) => ['notifications', 'my', page, size] as const,
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
    my: () => ['shifts', 'my'] as const,
    detail: (id: number) => ['shifts', 'details', id] as const,
  },

  stockMovements: {
    root: () => ['stock-movements'] as const,
    list: (params: unknown) => ['stock-movements', 'list', params] as const,
    detail: (id: number) => ['stock-movements', 'details', id] as const,
  },

  tasks: {
    root: () => ['tasks'] as const,
    all: (params?: unknown) => ['tasks', 'all', params ?? {}] as const,
    my: (params?: unknown) => ['tasks', 'my', params ?? {}] as const,
    detail: (id: number) => ['tasks', 'details', id] as const,
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
  },

  warehouses: {
    root: () => ['warehouses'] as const,
    all: (params?: unknown) => ['warehouses', 'all', params ?? {}] as const,
    managers: () => ['warehouses', 'managers'] as const,
    detail: (id: number) => ['warehouses', 'details', id] as const,
  },
  
  countries: {
    root: () => ['countries'] as const,
    all: () => ['countries', 'all'] as const,
    active: () => ['countries', 'active'] as const,
    detail: (id: number) => ['countries', 'details', id] as const,
  },
} as const;
