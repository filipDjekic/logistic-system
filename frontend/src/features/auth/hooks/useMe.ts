import { useQuery } from '@tanstack/react-query';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
import { authStore, useAuthStore } from '../../../core/auth/authStore';
import { authApi } from '../api/authApi';

export function useMe() {
  const auth = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.me,
    enabled: Boolean(auth.accessToken),
    retry: false,
    staleTime: cacheTimes.session,
  });
}

export function useInitializeAuth() {
  const auth = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.bootstrap(auth.accessToken),
    enabled: Boolean(auth.accessToken) && auth.status !== 'authenticated',
    retry: false,
    staleTime: cacheTimes.session,
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
