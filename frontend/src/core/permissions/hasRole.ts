import type { AuthUser } from '../auth/auth.types';
import type { Role } from '../constants/roles';

export function hasRole(user: AuthUser | null, role: Role): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: AuthUser | null, roles: readonly Role[]): boolean {
  if (!user) {
    return false;
  }

  return roles.includes(user.role as Role);
}