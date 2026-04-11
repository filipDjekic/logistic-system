import type { EmployeePosition } from '../../employees/types/employee.types';
import type { UserStatus } from '../../users/types/user.types';

export type CompanyResponse = {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
  adminUserId: number | null;
  adminEmployeeId: number | null;
};

export type CompanyAdminEmployeeRequest = {
  jmbg: string;
  phoneNumber: string;
  position: EmployeePosition;
  employmentDate: string;
  salary: number;
};

export type CompanyAdminRequest = {
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  employee: CompanyAdminEmployeeRequest;
};

export type CompanyCreateRequest = {
  name: string;
  admin: CompanyAdminRequest;
};

export type CompanyUpdateRequest = {
  name: string;
  active: boolean;
};