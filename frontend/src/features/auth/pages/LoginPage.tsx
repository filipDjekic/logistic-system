import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import logoMini from '../../../assets/images/logo.png';
import { appEnv } from '../../../core/config/env';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginSchemaValues } from '../validation/loginSchema';

const defaultValues: LoginSchemaValues = {
  email: '',
  password: '',
};

export default function LoginPage() {
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
  });

  const serverError = loginMutation.isError ? getErrorMessage(loginMutation.error) : null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        background:
          'radial-gradient(circle at top left, rgba(91, 75, 255, 0.14), transparent 24%), radial-gradient(circle at bottom right, rgba(8, 145, 178, 0.14), transparent 24%)',
      }}
    >
      <Paper
        component="section"
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, sm: 4 },
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              component="img"
              src={logoMini}
              alt={`${appEnv.appName} logo`}
              sx={{ width: 64, height: 64, objectFit: 'contain' }}
            />

            <Stack spacing={1}>
              <Typography variant="h4">Sign in</Typography>
              <Typography variant="body2" color="text.secondary">
                Use your company credentials to access the logistics management system.
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          {serverError ? <Alert severity="error">{serverError}</Alert> : null}

          <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  autoComplete="username"
                  fullWidth
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  disabled={isSubmitting || loginMutation.isPending}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  fullWidth
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  disabled={isSubmitting || loginMutation.isPending}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}