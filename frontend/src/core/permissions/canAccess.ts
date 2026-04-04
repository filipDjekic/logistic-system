import type { AuthUser } from '../auth/auth.types';
import type { Role } from '../constants/roles';
import { hasAnyRole } from './hasRole';

type CanAccessParams = {
  user: AuthUser | null;
  allowedRoles?: readonly Role[];
};

export function canAccess({ user, allowedRoles }: CanAccessParams): boolean {
  if (!user) {
    return false;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return hasAnyRole(user, allowedRoles);
}