import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@/test/test-utils';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import LoginPage from '../LoginPage';

const loginMock = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null as unknown,
}));

vi.mock('../../hooks/useLogin', () => ({
  useLogin: () => loginMock,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mutateAsync.mockReset();
    loginMock.isPending = false;
    loginMock.isError = false;
    loginMock.error = null;
  });

  it('renders login fields and submit action', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('submits valid credentials through the login mutation', async () => {
    loginMock.mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(loginMock.mutateAsync).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      });
    });
  });
});
