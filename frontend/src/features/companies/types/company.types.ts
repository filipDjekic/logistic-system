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

export type CompanyAdminRequest = {
  password: string;
  firstName: string;
  lastName: string;
  jmbg: string;
  phoneNumber: string;
  employmentDate: string;
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
  position: 'COMPANY_ADMIN';
  username: string;
  email: string;
};