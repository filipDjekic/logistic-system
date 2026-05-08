import { useMemo, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { timezonesApi } from '../../timezones/api/timezonesApi';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useSubmitCompanyRegistration } from '../hooks/useCompanyRegistrationMutations';
import {
  companyRegistrationSchema,
  type CompanyRegistrationSchemaValues,
} from '../validation/companyRegistrationSchema';

const defaultValues: CompanyRegistrationSchemaValues = {
  companyName: '',
  registrationNumber: '',
  taxNumber: '',
  companyEmail: '',
  companyPhoneNumber: '',
  countryId: 0,
  cityId: 0,
  timezoneId: 0,
  address: '',
  postalCode: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhoneNumber: '',
  adminJmbg: '',
  adminPassword: '',
  adminEmploymentDate: '',
  notes: '',
};

export default function CompanyRegistrationPage() {
  const submitMutation = useSubmitCompanyRegistration();
  const createdRequestIdRef = useRef<number | null>(null);
  const countriesQuery = useActiveCountries(true);

  const form = useForm<CompanyRegistrationSchemaValues>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const selectedCountryId = useWatch({ control: form.control, name: 'countryId' });
  const citiesQuery = useCitiesByCountry(Number(selectedCountryId) || null, Boolean(selectedCountryId));
  const timezonesQuery = useQuery({
    queryKey: queryKeys.timezones.byCountry(Number(selectedCountryId) || null),
    queryFn: () => timezonesApi.getByCountry(Number(selectedCountryId)),
    enabled: Boolean(selectedCountryId),
    staleTime: 60_000,
  });

  const countryOptions = useMemo(
    () => (countriesQuery.data ?? []).map((country) => ({ value: country.id, label: `${country.name} (${country.iso2Code})` })),
    [countriesQuery.data],
  );

  const cityOptions = useMemo(
    () => (citiesQuery.data ?? []).map((city) => ({ value: city.id, label: city.name })),
    [citiesQuery.data],
  );

  const timezoneOptions = useMemo(
    () => (timezonesQuery.data ?? []).map((timezone) => ({ value: timezone.id, label: timezone.displayName ?? timezone.name })),
    [timezonesQuery.data],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await submitMutation.mutateAsync({
      ...values,
      countryId: Number(values.countryId),
      cityId: Number(values.cityId),
      timezoneId: Number(values.timezoneId),
    });
    createdRequestIdRef.current = response.id;
    form.reset(defaultValues);
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: 2,
        py: 4,
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at top left, rgba(37, 99, 235, 0.10), transparent 24%), radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.10), transparent 24%)',
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 980, p: { xs: 2.5, sm: 4 }, borderRadius: 1 }} elevation={0}>
        <Stack spacing={3}>
          <Stack spacing={1} textAlign="center">
            <Typography variant="h4">Register company</Typography>
            <Typography variant="body2" color="text.secondary">
              Submit company data for Overlord review. Approval creates the company, COMPANY_ADMIN user and employee profile.
            </Typography>
            <Button component={RouterLink} to="/login" variant="text" sx={{ alignSelf: 'center' }}>
              Back to sign in
            </Button>
          </Stack>

          <Divider />

          {createdRequestIdRef.current ? (
            <Alert severity="success">Request #{createdRequestIdRef.current} was submitted and is waiting for review.</Alert>
          ) : null}

          {submitMutation.isError ? <Alert severity="error">{getErrorMessage(submitMutation.error)}</Alert> : null}

          <Stack component="form" spacing={3} onSubmit={onSubmit} noValidate>
            <Stack spacing={1}>
              <Typography variant="h6">Company information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller name="companyName" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Company name" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller name="registrationNumber" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Registration number" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller name="taxNumber" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Tax number" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="companyEmail" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Company email" type="email" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="companyPhoneNumber" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Company phone" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="countryId" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} select label="Country" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} onChange={(event) => { field.onChange(Number(event.target.value)); form.setValue('cityId', 0); form.setValue('timezoneId', 0); }}>
                      {countryOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="cityId" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} select label="City" fullWidth disabled={!selectedCountryId} error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>
                      {cityOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="timezoneId" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} select label="Timezone" fullWidth disabled={!selectedCountryId} error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>
                      {timezoneOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Controller name="address" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Address" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="postalCode" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Postal code" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
              </Grid>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="h6">Initial company administrator</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller name="adminFirstName" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="First name" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="adminLastName" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Last name" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="adminEmail" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Admin email" type="email" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="adminPhoneNumber" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Admin phone" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="adminJmbg" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Admin JMBG" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="adminPassword" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Initial password" type="password" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="adminEmploymentDate" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Employment date" type="date" InputLabelProps={{ shrink: true }} fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
                <Grid item xs={12}>
                  <Controller name="notes" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Notes" multiline minRows={3} fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                  )} />
                </Grid>
              </Grid>
            </Stack>

            <Button type="submit" variant="contained" size="large" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit registration request'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
