export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskResponse = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedEmployeeId: number;
  transportOrderId: number | null;
};

export type TaskCreateRequest = {
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedEmployeeId: number;
  transportOrderId?: number | null;
};

export type TaskUpdateRequest = {
  id?: number;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedEmployeeId: number;
  transportOrderId?: number | null;
};

export type TaskStatusUpdateRequest = TaskStatus;

export type TaskFiltersState = {
  search: string;
  status: TaskStatus | 'ALL';
  priority: TaskPriority | 'ALL';
};