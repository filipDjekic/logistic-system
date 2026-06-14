import type { TaskStatus } from '../../features/tasks/types/task.types';
import type { TransportOrderStatus } from '../../features/transport-orders/types/transportOrder.types';

export const appConfig = {
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  shift: {
    maxDurationHours: 8,
  },
  statusTransitions: {
    task: {
      NEW: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
      OPEN: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
      ASSIGNED: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'],
      IN_PROGRESS: ['BLOCKED', 'COMPLETED', 'CANCELLED'],
      BLOCKED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    } satisfies Record<TaskStatus, TaskStatus[]>,
    transportOrder: {
      DRAFT: ['ASSIGNED', 'CANCELLED'],
      ASSIGNED: ['PICKING', 'CANCELLED'],
      PICKING: ['PACKING', 'CANCELLED'],
      PACKING: ['READY_FOR_LOADING', 'CANCELLED'],
      READY_FOR_LOADING: ['LOADING', 'CANCELLED'],
      LOADING: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['DELIVERED', 'RETURNING', 'FAILED'],
      RETURNING: ['FAILED'],
      RESCHEDULED: ['ASSIGNED', 'CANCELLED'],
      DELIVERED: [],
      FAILED: [],
      CANCELLED: [],
    } satisfies Record<TransportOrderStatus, TransportOrderStatus[]>,
  },
} as const;
