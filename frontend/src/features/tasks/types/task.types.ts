export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskLinkedProcessType = 'TRANSPORT_ORDER' | 'STOCK_MOVEMENT' | 'UNLINKED';

export type TaskResponse = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedEmployeeId: number;
  transportOrderId: number | null;
  stockMovementId: number | null;
};

export type TaskCreateRequest = {
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedEmployeeId: number;
  transportOrderId?: number | null;
  stockMovementId?: number | null;
};

export type TaskUpdateRequest = {
  id?: number;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedEmployeeId: number;
  transportOrderId?: number | null;
  stockMovementId?: number | null;
};

export type TaskFiltersState = {
  search: string;
  status: TaskStatus | 'ALL';
  priority: TaskPriority | 'ALL';
  assignedEmployeeId: number | 'ALL';
  linkedProcessType: TaskLinkedProcessType | 'ALL';
};

export type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  assignedEmployeeId: number | '';
  transportOrderId: number | '';
  stockMovementId: number | '';
};