import type { Role } from '../../../core/constants/roles';

export type AuthCompany = {
  id: number;
  name: string;
  active: boolean;
};

export type AuthMeResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  role: Role;
  company: AuthCompany | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  userId: number;
  role: Role;
};

export type MeResponse = AuthMeResponse;
