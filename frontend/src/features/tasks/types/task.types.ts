import type { TemporalView } from '../../../core/utils/timezoneFormat';

export type TaskStatus = 'NEW' | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskType = 'PICKING' | 'PACKING' | 'LOADING' | 'DRIVING' | 'UNLOADING' | 'COUNTING' | 'MAINTENANCE' | 'ADMIN' | 'STOCK_MOVEMENT';

export type TaskLinkedProcessType = 'TRANSPORT_ORDER' | 'STOCK_MOVEMENT' | 'UNLINKED';

export type TaskResponse = {
  id: number;
  version: number;
  title: string;
  description: string | null;
  dueDate: string;
  dueDateView?: TemporalView | null;
  dueDateTimezone?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  taskType: TaskType;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  overdue?: boolean;
  assignedEmployeeId: number;
  transportOrderId: number | null;
  stockMovementId: number | null;
};

export type TaskCreateRequest = {
  title: string;
  description?: string;
  dueDate: string;
  dueDateView?: TemporalView | null;
  dueDateTimezone?: string | null;
  priority: TaskPriority;
  taskType: TaskType;
  assignedEmployeeId: number;
  transportOrderId?: number | null;
  stockMovementId?: number | null;
};

export type TaskUpdateRequest = {
  expectedVersion: number;
  title: string;
  description?: string;
  dueDate: string;
  dueDateView?: TemporalView | null;
  dueDateTimezone?: string | null;
  priority: TaskPriority;
  taskType: TaskType;
  assignedEmployeeId: number;
  transportOrderId?: number | null;
  stockMovementId?: number | null;
};

export type TaskStatusUpdateRequest = {
  status: TaskStatus;
  reason?: string;
  expectedVersion?: number;
};

export type AllowedStatusTransitionsResponse<TStatus extends string> = {
  currentStatus: TStatus;
  allowedStatuses: TStatus[];
  currentVersion?: number;
};

export type TaskFiltersState = {
  search: string;
  status: TaskStatus | 'ALL';
  priority: TaskPriority | 'ALL';
  assignedEmployeeId: number | 'ALL';
  linkedProcessType: TaskLinkedProcessType | 'ALL';
};

export type TaskQueryParams = {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedEmployeeId?: number;
  transportOrderId?: number;
  stockMovementId?: number;
  linkedProcessType?: TaskLinkedProcessType;
};

export type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  dueDateView?: TemporalView | null;
  dueDateTimezone?: string | null;
  priority: TaskPriority;
  taskType: TaskType;
  assignedEmployeeId: number | '';
  transportOrderId: number | '';
  stockMovementId: number | '';
};