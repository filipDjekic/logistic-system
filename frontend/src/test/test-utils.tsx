import type { PropsWithChildren, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import AppThemeProvider from '@/app/providers/ThemeProvider';
import AppSnackbarProvider from '@/app/providers/SnackbarProvider';
import { authStore } from '@/core/auth/authStore';
import { ROLES, type Role } from '@/core/constants/roles';
import type { AuthUser } from '@/core/auth/auth.types';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type TestProvidersProps = PropsWithChildren<{
  router?: MemoryRouterProps;
  queryClient?: QueryClient;
}>;

export function TestProviders({
  children,
  router,
  queryClient = createTestQueryClient(),
}: TestProvidersProps) {
  return (
    <MemoryRouter {...router}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AppSnackbarProvider>{children}</AppSnackbarProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  router?: MemoryRouterProps;
  queryClient?: QueryClient;
};

export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { router, queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders router={router} queryClient={queryClient}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

export function createAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    enabled: true,
    role: ROLES.COMPANY_ADMIN,
    company: {
      id: 1,
      name: 'Test Company',
      active: true,
    },
    ...overrides,
  };
}

export function authenticateTestUser(role: Role = ROLES.COMPANY_ADMIN, overrides: Partial<AuthUser> = {}) {
  const user = createAuthUser({ role, ...overrides });
  authStore.setAuthenticated({
    accessToken: 'test-access-token',
    user,
  });

  return user;
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
