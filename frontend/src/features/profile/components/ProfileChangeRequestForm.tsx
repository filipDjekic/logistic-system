import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import { useCreateProfileChangeRequest } from '../hooks/useCreateProfileChangeRequest';
import type { ProfileResponse } from '../types/profile.types';
import type { EmployeeProfileChangeRequestCreate } from '../types/profileChangeRequest.types';
import { profileChangeRequestSchema, type ProfileChangeRequestFormValues } from '../validation/profileChangeRequestSchema';

const defaultValues: ProfileChangeRequestFormValues = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  address: '',
  cityId: '',
  countryId: '',
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

  addStringChange(requestedChanges, 'firstName', values.firstName);
  addStringChange(requestedChanges, 'lastName', values.lastName);
  addStringChange(requestedChanges, 'phoneNumber', values.phoneNumber);
  addStringChange(requestedChanges, 'address', values.address);
  addIdChange(requestedChanges, 'countryId', values.countryId);
  addIdChange(requestedChanges, 'cityId', values.cityId);

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
  const countriesQuery = useActiveCountries();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileChangeRequestFormValues>({
    resolver: zodResolver(profileChangeRequestSchema) as never,
    defaultValues,
    mode: 'onBlur',
  });

  const requestedCountryId = useWatch({ control, name: 'countryId' });
  const requestedCityId = useWatch({ control, name: 'cityId' });
  const effectiveCountryId = Number(requestedCountryId || profile.countryId || 0) || null;
  const citiesQuery = useCitiesByCountry(effectiveCountryId, Boolean(effectiveCountryId));

  const countryOptions = useMemo(
    () => (countriesQuery.data ?? []).map((country) => ({
      value: String(country.id),
      label: country.name,
      phoneCode: country.phoneCode,
    })),
    [countriesQuery.data],
  );

  const cityOptions = useMemo(
    () => (citiesQuery.data ?? []).map((city) => ({
      value: String(city.id),
      label: city.postalCode ? `${city.name} (${city.postalCode})` : city.name,
      countryId: city.countryId,
      postalCode: city.postalCode,
    })),
    [citiesQuery.data],
  );

  const selectedCountry = (countriesQuery.data ?? []).find((country) => country.id === Number(requestedCountryId));
  const selectedCity = (citiesQuery.data ?? []).find((city) => city.id === Number(requestedCityId));

  useEffect(() => {
    if (!requestedCityId) {
      return;
    }
    const selectedCityBelongsToCountry = cityOptions.some((city) => city.value === String(requestedCityId));
    if (!selectedCityBelongsToCountry) {
      setValue('cityId', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [cityOptions, requestedCityId, setValue]);

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
              Enter only the fields that should be corrected. Approved name changes automatically update the employee and user email.
            </Typography>
          </Box>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New first name"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.firstName)}
                      helperText={errors.firstName?.message || `Current: ${profile.employeeFirstName || profile.firstName || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New last name"
                      fullWidth
                      disabled={disabled || submitting}
                      error={Boolean(errors.lastName)}
                      helperText={errors.lastName?.message || `Current: ${profile.employeeLastName || profile.lastName || '-'}`}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
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

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="countryId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="New country"
                      fullWidth
                      disabled={disabled || submitting || countriesQuery.isLoading}
                      error={Boolean(errors.countryId)}
                      helperText={
                        errors.countryId?.message
                        || (selectedCountry?.phoneCode ? `Phone code will be set automatically: +${selectedCountry.phoneCode}` : `Current: ${profile.countryName || '-'}`)
                      }
                    >
                      <MenuItem value="">No country change</MenuItem>
                      {countryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="New city"
                      fullWidth
                      disabled={disabled || submitting || !effectiveCountryId || citiesQuery.isLoading}
                      error={Boolean(errors.cityId)}
                      helperText={
                        errors.cityId?.message
                        || (selectedCity?.postalCode ? `Postal code will be set automatically: ${selectedCity.postalCode}` : `Current: ${profile.cityName || '-'}`)
                      }
                    >
                      <MenuItem value="">No city change</MenuItem>
                      {cityOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </TextField>
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
