import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authStore, useAuthStore } from '../../../core/auth/authStore';

export function useMe() {
  const auth = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: Boolean(auth.accessToken),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useInitializeAuth() {
  const auth = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'bootstrap', auth.accessToken],
    enabled: Boolean(auth.accessToken) && auth.status !== 'authenticated',
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      authStore.setLoading();

      try {
        const user = await authApi.me();
        const currentToken = authStore.getState().accessToken;

        if (!currentToken) {
          throw new Error('Authentication token is missing');
        }

        authStore.setAuthenticated({
          accessToken: currentToken,
          user,
        });

        return user;
      } catch (error) {
        authStore.setUnauthenticated();
        throw error;
      }
    },
  });
}