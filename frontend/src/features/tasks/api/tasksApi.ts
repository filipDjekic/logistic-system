import { apiClient } from '../../../core/api/client';
import type {
  TaskCreateRequest,
  TaskResponse,
  TaskStatus,
  TaskUpdateRequest,
} from '../types/task.types';

export const tasksApi = {
  getAll() {
    return apiClient.get<TaskResponse[]>('/api/tasks').then((response) => response.data);
  },

  getMy() {
    return apiClient.get<TaskResponse[]>('/api/tasks/my').then((response) => response.data);
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
