import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import CompanyRegistrationPage from '../CompanyRegistrationPage';

const registrationMutation = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null as unknown,
}));

vi.mock('../../hooks/useCompanyRegistrationMutations', () => ({
  useSubmitCompanyRegistration: () => registrationMutation,
}));

vi.mock('../../../countries/hooks/useCountries', () => ({
  useActiveCountries: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock('../../../cities/hooks/useCities', () => ({
  useCitiesByCountry: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock('../../api/companyRegistrationApi', () => ({
  companyRegistrationApi: {
    validate: vi.fn().mockResolvedValue({
      companyNameAvailable: true,
      registrationNumberAvailable: true,
      taxNumberAvailable: true,
      adminEmailAvailable: true,
      valid: true,
    }),
  },
}));

describe('CompanyRegistrationPage', () => {
  beforeEach(() => {
    registrationMutation.mutateAsync.mockReset();
    registrationMutation.isPending = false;
    registrationMutation.isError = false;
    registrationMutation.error = null;
  });

  it('renders the public registration form with its router, theme, query, form, and snackbar contexts', async () => {
    renderWithProviders(<CompanyRegistrationPage />, {
      router: { initialEntries: ['/register-company'] },
    });

    expect(screen.getByRole('heading', { name: /create your logistics workspace/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    expect(await screen.findByText('Company name available')).toBeInTheDocument();
  });

  it('keeps an empty request on the first step and shows field validation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyRegistrationPage />, {
      router: { initialEntries: ['/register-company'] },
    });

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(await screen.findByText('Company name is required')).toBeInTheDocument();
    expect(registrationMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
