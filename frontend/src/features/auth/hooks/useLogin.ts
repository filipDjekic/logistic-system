import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { authStore } from '../../../core/auth/authStore';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { persistAccessToken } from '../../../core/auth/auth.utils';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import type { LoginRequest } from '../types/auth.types';

export function useLogin() {
  const navigate = useNavigate();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      authStore.setLoading();

      const loginResponse = await authApi.login(payload);

      persistAccessToken(loginResponse.token);

      try {
        const user = await authApi.me();

        authStore.setAuthenticated({
          accessToken: loginResponse.token,
          user,
        });

        return { loginResponse, user };
      } catch (error) {
        authStore.setUnauthenticated();
        throw error;
      }
    },
    onSuccess: () => {
      showSnackbar({
        message: 'Successfully signed in.',
        severity: 'success',
      });

      navigate('/', { replace: true });
    },
    onError: (error) => {
      authStore.setUnauthenticated();

      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}