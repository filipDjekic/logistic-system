export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
    bootstrap: (accessToken: string | null | undefined) =>
      ['auth', 'bootstrap', accessToken ?? null] as const,
  },

  activityLogs: {
    all: () => ['activity-logs', 'all'] as const,
    detail: (id: number) => ['activity-logs', 'details', id] as const,
    byUser: (userId: number) => ['activity-logs', 'user', userId] as const,
  },

  changeHistory: {
    all: () => ['change-history', 'all'] as const,
    detail: (id: number) => ['change-history', 'details', id] as const,
  },

  companies: {
    all: () => ['companies', 'all'] as const,
    detail: (id: number) => ['companies', 'details', id] as const,
  },

  dashboard: {
    myTasks: () => ['dashboard', 'my-tasks'] as const,
    myUnreadNotificationsCount: () =>
      ['dashboard', 'my-unread-notifications-count'] as const,
    transportOrders: () => ['dashboard', 'transport-orders'] as const,
    vehicles: () => ['dashboard', 'vehicles'] as const,
    warehouses: () => ['dashboard', 'warehouses'] as const,
    warehouseInventory: (warehouseId: number) =>
      ['dashboard', 'warehouse-inventory', warehouseId] as const,
  },

  employees: {
    all: () => ['employees', 'all'] as const,
    detail: (id: number) => ['employees', 'details', id] as const,
    tasks: (id: number) => ['employees', 'details', id, 'tasks'] as const,
    shifts: (id: number) => ['employees', 'details', id, 'shifts'] as const,
  },

  inventory: {
    list: (filters: unknown) => ['inventory', 'list', filters] as const,
    detail: (warehouseId: number, productId: number) =>
      ['inventory', 'details', warehouseId, productId] as const,
  },

  notifications: {
    my: (page: number, size: number) =>
      ['notifications', 'my', page, size] as const,
    myUnreadCount: () => ['notifications', 'my', 'unread-count'] as const,
  },

  roles: {
    all: () => ['roles', 'all'] as const,
    detail: (id: number) => ['roles', 'details', id] as const,
  },

  shifts: {
    all: () => ['shifts', 'all'] as const,
    my: () => ['shifts', 'my'] as const,
    detail: (id: number) => ['shifts', 'details', id] as const,
  },

  stockMovements: {
    all: () => ['stock-movements', 'all'] as const,
    detail: (id: number) => ['stock-movements', 'details', id] as const,
  },

  tasks: {
    all: () => ['tasks', 'all'] as const,
    my: () => ['tasks', 'my'] as const,
    detail: (id: number) => ['tasks', 'details', id] as const,
  },

  transportOrders: {
    all: () => ['transport-orders', 'all'] as const,
    detail: (id: number) => ['transport-orders', 'details', id] as const,
    items: (transportOrderId: number) =>
      ['transport-order-items', transportOrderId] as const,
    warehouses: () => ['transport-orders', 'warehouses'] as const,
    vehicles: () => ['transport-orders', 'vehicles'] as const,
    employees: () => ['transport-orders', 'employees'] as const,
    products: () => ['transport-orders', 'products'] as const,
  },

  users: {
    all: () => ['users', 'all'] as const,
    detail: (id: number) => ['users', 'details', id] as const,
  },

  vehicles: {
    all: () => ['vehicles', 'all'] as const,
    detail: (id: number) => ['vehicles', 'details', id] as const,
  },
} as const;