import type { UserStatus } from '../../users/types/user.types';

export type CompanyResponse = {
  id: number;
  name: string;
  active: boolean;
  countryId: number | null;
  countryCode: string | null;
  countryName: string | null;
  currencyCode: string | null;
  phoneCode: string | null;
  timezone: string | null;
  timezoneId: number | null;
  timezoneName: string | null;
  timezoneDisplayName: string | null;
  effectiveCurrencyCode: string | null;
  effectivePhoneCode: string | null;
  effectiveTimezone: string | null;
  address: string | null;
  cityId: number | null;
  cityName: string | null;
  city: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  taxNumber: string | null;
  registrationNumber: string | null;
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
  countryId: number;
  timezoneId: number;
  address?: string | null;
  cityId?: number | null;
  city?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  registrationNumber?: string | null;
  admin: CompanyAdminRequest;
};

export type CompanyUpdateRequest = {
  name: string;
  active: boolean;
  countryId: number;
  timezoneId: number;
  address?: string | null;
  cityId?: number | null;
  city?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  registrationNumber?: string | null;
};

export type BootstrapAdminPreview = {
  role: 'COMPANY_ADMIN';
  status: UserStatus;
  position: 'COMPANY_ADMIN';
  username: string;
  email: string;
};
