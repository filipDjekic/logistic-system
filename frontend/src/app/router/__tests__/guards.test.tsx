import { describe, expect, it } from 'vitest';
import { Navigate, Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, authenticateTestUser } from '@/test/test-utils';
import { ROLES } from '@/core/constants/roles';
import { ProtectedRoute, GuestRoute } from '../guards';

describe('router guards', () => {
  it('redirects unauthenticated users away from protected routes', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { router: { initialEntries: ['/protected'] } },
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('allows authenticated users with an allowed role', () => {
    authenticateTestUser(ROLES.COMPANY_ADMIN);

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={[ROLES.COMPANY_ADMIN]} />}>
          <Route path="/employees" element={<div>Employees page</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
      { router: { initialEntries: ['/employees'] } },
    );

    expect(screen.getByText('Employees page')).toBeInTheDocument();
  });

  it('redirects authenticated users without the required role to dashboard', () => {
    authenticateTestUser(ROLES.WORKER);

    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={[ROLES.HR_MANAGER]} />}>
          <Route path="/employees" element={<div>Employees page</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>,
      { router: { initialEntries: ['/employees'] } },
    );

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Employees page')).not.toBeInTheDocument();
  });

  it('redirects authenticated users away from guest routes', () => {
    authenticateTestUser(ROLES.COMPANY_ADMIN);

    renderWithProviders(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<div>Login page</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>,
      { router: { initialEntries: ['/login'] } },
    );

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });
});
