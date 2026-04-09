export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type UserResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  status: UserStatus;
  roleId: number;
  roleName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type UserCreateRequest = {
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  status: UserStatus;
};

export type UserUpdateRequest = {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  enabled: boolean;
  status: UserStatus;
};

export type UserFiltersState = {
  search: string;
  status: UserStatus | 'ALL';
  enabled: 'ALL' | 'ENABLED' | 'DISABLED';
};

export type CreateUserFormValues = {
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  status: UserStatus;
};

export type UpdateUserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  enabled: boolean;
  status: UserStatus;
};