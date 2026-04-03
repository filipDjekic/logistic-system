import type { AuthMeResponse } from '../../features/auth/types/auth.types';

export type AuthUser = AuthMeResponse;

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
};