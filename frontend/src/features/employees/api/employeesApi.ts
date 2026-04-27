import { apiClient } from '../../../core/api/client';
import { unwrapPageContent } from '../../../core/api/pagination';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  EmployeeCreateWithUserRequest,
  EmployeeListFilters,
  EmployeeResponse,
  EmployeeRoleOption,
  EmployeeShiftResponse,
  EmployeeTaskResponse,
  EmployeeUpdateRequest,
  EmployeeUserOption,
} from '../types/employee.types';

type UserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  roleId: number;
  roleName: string;
  employee?: {
    active: boolean;
  } | null;
};

type RoleResponse = {
  id: number;
  name: string;
  description: string | null;
};

export const employeesApi = {
  getAll(filters: EmployeeListFilters & PageParams = {}) {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
      params.set('search', filters.search.trim());
    }

    if (filters.position) {
      params.set('position', filters.position);
    }

    if (filters.active !== undefined) {
      params.set('active', String(filters.active));
    }

    if (filters.linkedUser) {
      params.set('linkedUser', filters.linkedUser);
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

    const queryString = params.toString();

    return apiClient
      .get<PageResponse<EmployeeResponse>>(`/api/employees${queryString ? `?${queryString}` : ''}`)
      .then((response) => response.data);
  },

  getById(id: number) {
    return apiClient
      .get<EmployeeResponse>(`/api/employees/${id}`)
      .then((response) => response.data);
  },

  createWithUser(payload: EmployeeCreateWithUserRequest) {
    return apiClient
      .post<EmployeeResponse>('/api/employees/with-user', payload)
      .then((response) => response.data);
  },

  update(id: number, payload: EmployeeUpdateRequest) {
    return apiClient
      .put<EmployeeResponse>(`/api/employees/${id}`, payload)
      .then((response) => response.data);
  },

  terminate(id: number) {
    return apiClient.patch<void>(`/api/employees/terminate/${id}`).then((response) => response.data);
  },

  getTasksByEmployeeId(id: number) {
    return apiClient
      .get<EmployeeTaskResponse[]>(`/api/employees/${id}/tasks`)
      .then((response) => response.data);
  },

  getShiftsByEmployeeId(id: number) {
    return apiClient
      .get<EmployeeShiftResponse[]>(`/api/employees/${id}/shifts`)
      .then((response) => response.data);
  },

  getUsers() {
    return apiClient
      .get<UserResponse[] | PageResponse<UserResponse>>('/api/users', {
        params: { size: 1000, sort: 'lastName,asc' },
      })
      .then((response) =>
        unwrapPageContent(response.data).map<EmployeeUserOption>((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          enabled: user.enabled,
          status: user.status,
          roleId: user.roleId,
          roleName: user.roleName,
          employeeActive: user.employee?.active ?? true,
        })),
      );
  },

  getRoles() {
    return apiClient
      .get<RoleResponse[] | PageResponse<RoleResponse>>('/api/roles')
      .then((response) =>
        unwrapPageContent(response.data).map<EmployeeRoleOption>((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })),
      );
  },
};
