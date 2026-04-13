import type { UserStatus } from '../../users/types/user.types';

export type CompanyResponse = {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
  adminUserId: number | null;
  adminEmployeeId: number | null;
  adminFullName: string | null;
  adminEmail: string | null;
};

export type CompanyAdminEmployeeRequest = {
  jmbg: string;
  phoneNumber: string;
  employmentDate: string;
};

export type CompanyAdminRequest = {
  password: string;
  firstName: string;
  lastName: string;
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

export type BootstrapAdminPreview = {
  role: 'COMPANY_ADMIN';
  status: UserStatus;
  position: 'MANAGER';
  username: string;
  email: string;
};
