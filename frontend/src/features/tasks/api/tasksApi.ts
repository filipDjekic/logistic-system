import { apiClient } from '../../../core/api/client';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  TaskCreateRequest,
  TaskQueryParams,
  TaskResponse,
  TaskStatus,
  TaskUpdateRequest,
} from '../types/task.types';

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

  getById(id: number) {
    return apiClient.get<TaskResponse>(`/api/tasks/${id}`).then((response) => response.data);
  },

  create(payload: TaskCreateRequest) {
    return apiClient.post<TaskResponse>('/api/tasks', payload).then((response) => response.data);
  },

  update(id: number, payload: TaskUpdateRequest) {
    return apiClient.put<TaskResponse>(`/api/tasks/${id}`, payload).then((response) => response.data);
  },

  updateStatus(id: number, status: TaskStatus) {
    return apiClient
      .patch<TaskResponse>(`/api/tasks/${id}/status`, JSON.stringify(status), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
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
