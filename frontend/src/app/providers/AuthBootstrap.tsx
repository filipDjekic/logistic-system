import type { PropsWithChildren } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useInitializeAuth } from '../../features/auth/hooks/useMe';
import { useAuthStore } from '../../core/auth/authStore';

export default function AuthBootstrap({ children }: PropsWithChildren) {
  const auth = useAuthStore();

  useInitializeAuth();

  const isBootstrapping =
    Boolean(auth.accessToken) &&
    (auth.status === 'idle' || auth.status === 'loading');

  if (isBootstrapping) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  return <>{children}</>;
}