export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type EmployeePosition =
  | 'OVERLORD'
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'WAREHOUSE_MANAGER'
  | 'WORKER';

export type UserCompanySummary = {
  id: number;
  name: string;
  active: boolean;
};

export type UserEmployeeSummary = {
  id: number;
  jmbg: string;
  phoneNumber: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
  active: boolean;
  companyId: number | null;
};

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
  company: UserCompanySummary | null;
  employee: UserEmployeeSummary | null;
};

export type UserEmployeeCreateRequest = {
  jmbg: string;
  phoneNumber: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
};

export type UserEmployeeUpdateRequest = {
  jmbg: string;
  phoneNumber: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
  active: boolean;
};

export type UserCreateRequest = {
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  status: UserStatus;
  employee: UserEmployeeCreateRequest;
};

export type UserUpdateRequest = {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  enabled: boolean;
  status: UserStatus;
  employee?: UserEmployeeUpdateRequest;
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
  employeeJmbg: string;
  employeePhoneNumber: string;
  employeePosition: EmployeePosition;
  employeeEmploymentDate: string;
  employeeSalary: string;
};

export type UpdateUserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  enabled: boolean;
  status: UserStatus;
  employeeJmbg: string;
  employeePhoneNumber: string;
  employeePosition: EmployeePosition;
  employeeEmploymentDate: string;
  employeeSalary: string;
  employeeActive: boolean;
};