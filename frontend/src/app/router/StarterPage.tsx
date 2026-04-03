import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { appEnv } from '../../core/config/env';
import { useAuthStore } from '../../core/auth/authStore';
import { useInitializeAuth } from '../../features/auth/hooks/useMe';

export default function StarterPage() {
  const auth = useAuthStore();

  useInitializeAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 3,
        background:
          'radial-gradient(circle at top left, rgba(98, 102, 241, 0.10), transparent 28%), radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.10), transparent 24%)',
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        {auth.status === 'loading' ? <CircularProgress size={28} /> : null}

        <Typography variant="h4">{appEnv.appName}</Typography>

        {auth.status === 'authenticated' && auth.user ? (
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
            Signed in as {auth.user.email} ({auth.user.role}). Application shell is ready for
            the next feature.
          </Typography>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
              Application shell is ready. Auth module is active and waiting for sign-in.
            </Typography>

            <Button component={RouterLink} to="/login" variant="contained">
              Go to login
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
}