import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useCreateProfileChangeRequest } from '../hooks/useCreateProfileChangeRequest';
import type { ProfileResponse } from '../types/profile.types';
import type { EmployeeProfileChangeRequestCreate } from '../types/profileChangeRequest.types';
import { profileChangeRequestSchema, type ProfileChangeRequestFormValues } from '../validation/profileChangeRequestSchema';

const defaultValues: ProfileChangeRequestFormValues = {
  phoneCode: '',
  phoneNumber: '',
  email: '',
  address: '',
  postalCode: '',
  cityId: '',
  countryId: '',
  timezoneId: '',
  reason: '',
};

function addStringChange(target: Record<string, unknown>, field: string, value: unknown) {
  if (typeof value !== 'string') {
    return;
  }
  const normalized = value.trim();
  if (normalized !== '') {
    target[field] = normalized;
  }
}

function addIdChange(target: Record<string, unknown>, field: string, value: unknown) {
  if (typeof value !== 'string') {
    return;
  }
  const normalized = value.trim();
  if (normalized !== '') {
    target[field] = Number(normalized);
  }
}

function toPayload(values: ProfileChangeRequestFormValues): EmployeeProfileChangeRequestCreate {
  const requestedChanges: Record<string, unknown> = {};

  addStringChange(requestedChanges, 'phoneCode', values.phoneCode);
  addStringChange(requestedChanges, 'phoneNumber', values.phoneNumber);
  addStringChange(requestedChanges, 'email', values.email);
  addStringChange(requestedChanges, 'address', values.address);
  addStringChange(requestedChanges, 'postalCode', values.postalCode);
  addIdChange(requestedChanges, 'cityId', values.cityId);
  addIdChange(requestedChanges, 'countryId', values.countryId);
  addIdChange(requestedChanges, 'timezoneId', values.timezoneId);

  return {
    requestedChanges,
    reason: values.reason?.trim() || null,
  };
}

type Props = {
  profile: ProfileResponse;
  disabled?: boolean;
};

export default function ProfileChangeRequestForm({ profile, disabled = false }: Props) {
  const createMutation = useCreateProfileChangeRequest();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileChangeRequestFormValues>({
    resolver: zodResolver(profileChangeRequestSchema) as never,
    defaultValues,
    mode: 'onBlur',
  });

  const submitting = isSubmitting || createMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync(toPayload(values));
    reset(defaultValues);
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Submit new profile change request
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter only the fields that should be corrected. Approved requests are applied by HR/Admin.
            </Typography>
          </Box>

          <Alert severity="info">
            Current values are shown as helper text. Position, salary, role, warehouse assignment and status cannot be changed from this form.
          </Alert>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="phoneCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New phone code"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.phoneCode)}
                      helperText={errors.phoneCode?.message || `Current: ${profile.phoneCode || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New phone number"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.phoneNumber)}
                      helperText={errors.phoneNumber?.message || `Current: ${profile.phoneNumber || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New employee email"
                      type="email"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.email)}
                      helperText={errors.email?.message || `Current: ${profile.employeeEmail || profile.email || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New postal code"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.postalCode)}
                      helperText={errors.postalCode?.message || `Current: ${profile.postalCode || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New address"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.address)}
                      helperText={errors.address?.message || `Current: ${profile.address || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New city ID"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.cityId)}
                      helperText={errors.cityId?.message || `Current: ${profile.cityName || profile.cityId || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="countryId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New country ID"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.countryId)}
                      helperText={errors.countryId?.message || `Current: ${profile.countryName || profile.countryId || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="timezoneId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New timezone ID"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.timezoneId)}
                      helperText={errors.timezoneId?.message || `Current: ${profile.timezoneDisplayName || profile.timezoneName || profile.timezoneId || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Reason"
                      fullWidth
                      multiline
                      minRows={3}
                      disabled={disabled || submitting}
                      error={Boolean(errors.reason)}
                      helperText={errors.reason?.message || 'Optional explanation for HR/Admin.'}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button type="button" variant="outlined" disabled={disabled || submitting} onClick={() => reset(defaultValues)}>
                Clear
              </Button>
              <Button type="submit" variant="contained" disabled={disabled || submitting}>
                Submit request
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
