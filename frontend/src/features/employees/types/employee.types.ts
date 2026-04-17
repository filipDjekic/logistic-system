export type EmployeePosition =
  | 'OVERLORD'
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'WAREHOUSE_MANAGER'
  | 'WORKER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type EmployeeResponse = {
  id: number;
  firstName: string;
  lastName: string;
  jmbg: string;
  phoneNumber: string;
  email: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
  active: boolean;
  userId: number | null;
  companyId: number | null;
  companyName: string | null;
};

export type EmployeeCreateRequest = {
  firstName: string;
  lastName: string;
  jmbg: string;
  phoneNumber: string;
  email: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
  userId?: number;
};

export type EmployeeCreateWithUserRequest = {
  firstName: string;
  lastName: string;
  jmbg: string;
  phoneNumber: string;
  email: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
  password: string;
  roleId: number;
  status: UserStatus;
};

export type EmployeeUpdateRequest = {
  firstName: string;
  lastName: string;
  jmbg: string;
  phoneNumber: string;
  email: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
  userId?: number;
};

export type EmployeeFiltersState = {
  search: string;
  position: EmployeePosition | 'ALL';
  linkedUser: 'ALL' | 'LINKED' | 'UNLINKED';
};

export type EmployeeUserOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  status: string;
  roleId: number;
  roleName: string;
};

export type EmployeeRoleOption = {
  id: number;
  name: string;
  description: string | null;
};

export type EmployeeTaskResponse = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedEmployeeId: number;
  transportOrderId: number | null;
};

export type EmployeeShiftResponse = {
  id: number;
  startTime: string;
  endTime: string;
  status: 'PLANNED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  notes: string;
  employeeId: number;
};

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  jmbg: string;
  phoneNumber: string;
  email: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: string;
  userId: string;
  password: string;
  roleId: string;
  status: UserStatus;
};