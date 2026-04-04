import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/authStore';
import { canAccess } from '../../core/permissions/canAccess';
import type { Role } from '../../core/constants/roles';

type ProtectedRouteProps = {
  allowedRoles?: readonly Role[];
  redirectTo?: string;
};

export function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const auth = useAuthStore();
  const location = useLocation();

  if (auth.status !== 'authenticated' || !auth.user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (!canAccess({ user: auth.user, allowedRoles })) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

type GuestRouteProps = {
  redirectTo?: string;
};

export function GuestRoute({ redirectTo = '/dashboard' }: GuestRouteProps) {
  const auth = useAuthStore();

  if (auth.status === 'authenticated' && auth.user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}