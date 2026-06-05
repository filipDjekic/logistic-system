import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  TaskCreateRequest,
  TaskFiltersState,
  TaskQueryParams,
  TaskResponse,
  TaskStatusUpdateRequest,
  TaskStatus,
  AllowedStatusTransitionsResponse,
  TaskUpdateRequest,
} from '../types/task.types';

export type StatusCountResponse = {
  status: string;
  count: number;
};

function buildTaskParams(filters?: TaskQueryParams & PageParams) {
  const params = new URLSearchParams();

  if (!filters) {
    return params;
  }
  if (filters.page != null) {
    params.set('page', String(filters.page));
  }

  if (filters.size != null) {
    params.set('size', String(filters.size));
  }

  if (filters.sort) {
    params.set('sort', filters.sort);
  }


  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.priority) {
    params.set('priority', filters.priority);
  }

  if (filters.assignedEmployeeId != null) {
    params.set('assignedEmployeeId', String(filters.assignedEmployeeId));
  }

  if (filters.transportOrderId != null) {
    params.set('transportOrderId', String(filters.transportOrderId));
  }

  if (filters.stockMovementId != null) {
    params.set('stockMovementId', String(filters.stockMovementId));
  }

  if (filters.linkedProcessType) {
    params.set('linkedProcessType', filters.linkedProcessType);
  }

  return params;
}

export const tasksApi = {
  getAll(filters?: TaskQueryParams & PageParams) {
    const params = buildTaskParams(filters);

    return apiClient
      .get<PageResponse<TaskResponse>>('/api/tasks', { params })
      .then((response) => response.data);
  },

  getMy(filters?: Omit<TaskQueryParams, 'assignedEmployeeId'> & PageParams) {
    const params = buildTaskParams(filters);

    return apiClient
      .get<PageResponse<TaskResponse>>('/api/tasks/my', { params })
      .then((response) => response.data);
  },


  getStatusCounts(filters?: Partial<TaskFiltersState> & Partial<Pick<TaskQueryParams, 'transportOrderId' | 'stockMovementId'>>) {
    const params = new URLSearchParams();

    if (filters?.search?.trim()) {
      params.set('search', filters.search.trim());
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      params.set('priority', filters.priority);
    }
    if (filters?.assignedEmployeeId != null && filters.assignedEmployeeId !== 'ALL') {
      params.set('assignedEmployeeId', String(filters.assignedEmployeeId));
    }
    if (filters?.transportOrderId != null && String(filters.transportOrderId) !== 'ALL') {
      params.set('transportOrderId', String(filters.transportOrderId));
    }
    if (filters?.stockMovementId != null && String(filters.stockMovementId) !== 'ALL') {
      params.set('stockMovementId', String(filters.stockMovementId));
    }
    if (filters?.linkedProcessType && filters.linkedProcessType !== 'ALL') {
      params.set('linkedProcessType', filters.linkedProcessType);
    }

    return apiClient
      .get<StatusCountResponse[]>('/api/tasks/status-counts', { params })
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient.get<TaskResponse>(`/api/tasks/${id}`).then((response) => response.data);
  },

  create(payload: TaskCreateRequest) {
    return apiClient.post<TaskResponse>('/api/tasks', payload).then((response) => response.data);
  },

  update(id: number, payload: TaskUpdateRequest) {
    return apiClient.put<TaskResponse>(`/api/tasks/${id}`, payload).then((response) => response.data);
  },

  getAllowedStatusTransitions(id: number) {
    return apiClient
      .get<AllowedStatusTransitionsResponse<TaskStatus>>(`/api/tasks/${id}/status-transitions`)
      .then((response) => response.data);
  },

  updateStatus(id: number, status: TaskStatus, reason?: string, expectedVersion?: number) {
    const payload: TaskStatusUpdateRequest = { status, reason, expectedVersion };

    return apiClient
      .patch<TaskResponse>(`/api/tasks/${id}/status`, payload)
      .then((response) => response.data);
  },

  assignTask(id: number, employeeId: number) {
    return apiClient
      .patch<TaskResponse>(`/api/tasks/${id}/employee/${employeeId}`)
      .then((response) => response.data);
  },

  delete(id: number) {
    return apiClient.delete<void>(`/api/tasks/${id}`).then((response) => response.data);
  },
};
