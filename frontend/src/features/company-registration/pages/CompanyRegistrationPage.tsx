import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { timezonesApi } from '../../timezones/api/timezonesApi';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useSubmitCompanyRegistration } from '../hooks/useCompanyRegistrationMutations';
import { companyRegistrationApi } from '../api/companyRegistrationApi';
import { companyRegistrationSchema, type CompanyRegistrationSchemaValues } from '../validation/companyRegistrationSchema';

const steps = ['Company', 'Location', 'Administrator', 'Review'];
const stepFields: Array<Array<string>> = [
  ['companyName', 'registrationNumber', 'taxNumber', 'companyEmail', 'companyPhoneNumber'],
  ['countryId', 'cityId', 'timezoneId', 'address'],
  ['adminFirstName', 'adminLastName', 'adminEmail', 'adminPhoneNumber', 'adminJmbg', 'adminAddress', 'adminPassword', 'adminEmploymentDate'],
  [],
];

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
  adminAddress: '',
  adminEmail: '',
  adminPhoneNumber: '',
  adminJmbg: '',
  adminPassword: '',
  adminEmploymentDate: '',
  notes: '',
};

const featureCards = [
  { title: 'Fleet management', description: 'Manage vehicles, drivers and maintenance.', icon: LocalShippingOutlinedIcon },
  { title: 'Warehouse operations', description: 'Track inventory, locations and stock levels.', icon: WarehouseOutlinedIcon },
  { title: 'Employee organization', description: 'Organize teams, roles and work shifts.', icon: GroupsOutlinedIcon },
  { title: 'Reports and analytics', description: 'Gain insights with reports and dashboards.', icon: QueryStatsOutlinedIcon },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function buildCompanyEmail(companyName?: string, countryCode?: string | null) {
  const companySlug = slugify(companyName || 'company');
  const countrySlug = slugify(countryCode || 'rs');
  return `contact@${companySlug || 'company'}.${countrySlug || 'rs'}`;
}

function buildAdminEmail(firstName?: string, lastName?: string, companyName?: string, role?: string, countryCode?: string | null) {
  const first = slugify(firstName || 'admin');
  const last = slugify(lastName || 'user');
  const companySlug = slugify(companyName || 'company');
  const roleSlug = slugify(role || 'company-admin');
  const countrySlug = slugify(countryCode || 'rs');
  return `${first || 'admin'}.${last || 'user'}@${companySlug || 'company'}.${roleSlug || 'company-admin'}.${countrySlug || 'rs'}`;
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

function SummaryRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} textAlign="right">{value || '—'}</Typography>
    </Stack>
  );
}

export default function CompanyRegistrationPage() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  const submitMutation = useSubmitCompanyRegistration();
  const countriesQuery = useActiveCountries(true);

  const form = useForm<CompanyRegistrationSchemaValues>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const values = useWatch({ control: form.control });
  const selectedCountryId = Number(values.countryId) || null;
  const citiesQuery = useCitiesByCountry(selectedCountryId, Boolean(selectedCountryId));
  const timezonesQuery = useQuery({
    queryKey: queryKeys.timezones.byCountry(selectedCountryId),
    queryFn: () => timezonesApi.getByCountry(Number(selectedCountryId)),
    enabled: Boolean(selectedCountryId),
    staleTime: 60_000,
  });

  const country = countriesQuery.data?.find((item) => item.id === Number(values.countryId));
  const countryEmailCode = country?.iso2Code ?? 'rs';
  const city = citiesQuery.data?.find((item) => item.id === Number(values.cityId));
  useEffect(() => {
    form.setValue('postalCode', city?.postalCode ?? '', {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form, city?.postalCode]);
  const timezone = timezonesQuery.data?.find((item) => item.id === Number(values.timezoneId));
  const score = passwordScore(values.adminPassword ?? '');

  const validationQuery = useQuery({
    queryKey: ['company-registration-validation', values.companyName, values.registrationNumber, values.taxNumber, values.adminEmail],
    queryFn: () => companyRegistrationApi.validate({
      companyName: values.companyName,
      registrationNumber: values.registrationNumber,
      taxNumber: values.taxNumber,
      adminEmail: values.adminEmail,
    }),
    enabled: activeStep <= 2,
    staleTime: 15000,
  });

  useEffect(() => {
    form.setValue('companyEmail', buildCompanyEmail(values.companyName, countryEmailCode), { shouldValidate: true, shouldDirty: true });
  }, [form, values.companyName, countryEmailCode]);

  useEffect(() => {
    form.setValue('adminEmail', buildAdminEmail(values.adminFirstName, values.adminLastName, values.companyName, 'COMPANY_ADMIN', countryEmailCode), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form, values.adminFirstName, values.adminLastName, values.companyName, countryEmailCode]);

  const countryOptions = useMemo(
    () => (countriesQuery.data ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.iso2Code})` })),
    [countriesQuery.data],
  );
  const cityOptions = useMemo(() => (citiesQuery.data ?? []).map((item) => ({ value: item.id, label: item.name })), [citiesQuery.data]);
  const timezoneOptions = useMemo(
    () => (timezonesQuery.data ?? []).map((item) => ({ value: item.id, label: item.displayName ?? item.name })),
    [timezonesQuery.data],
  );

  const goNext = async () => {
    const valid = await form.trigger(stepFields[activeStep] as Array<keyof CompanyRegistrationSchemaValues>);
    if (valid) setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const submit = form.handleSubmit(async (payload) => {
    const response = await submitMutation.mutateAsync({
      ...payload,
      countryId: Number(payload.countryId),
      cityId: Number(payload.cityId),
      timezoneId: Number(payload.timezoneId),
      postalCode: city?.postalCode ?? '',
    });

    navigate(`/register-company/status/${response.id}`, {
      replace: true,
    });
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
        background: `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.16)}, transparent 28%), radial-gradient(circle at bottom right, ${alpha(theme.palette.secondary.main, 0.12)}, transparent 30%), ${theme.palette.background.default}`,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1320,
          mx: 'auto',
          overflow: 'hidden',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.background.paper, 0.84),
          backdropFilter: 'blur(10px)',
          boxShadow: theme.shadows[3],
        }}
      >
        {activeStep === 0 ? (
          <Box sx={{ p: { xs: 2.5, md: 4.5 } }}>
            <Stack spacing={3}>
              <Chip label="Public onboarding" sx={{ alignSelf: 'flex-start', fontWeight: 800 }} />
              <Box>
                <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: '-0.04em', fontSize: { xs: '2.25rem', md: '3.25rem' } }}>
                  Create your logistics workspace
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 720, fontSize: '1.05rem' }}>
                  Submit a company request. Overlord approval creates the company, administrator account and initial workspace profile.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {featureCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Grid key={item.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                      <Card variant="outlined" sx={{ height: '100%', bgcolor: alpha(theme.palette.background.paper, 0.55) }}>
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ color: 'primary.main', display: 'flex' }}><Icon fontSize="large" /></Box>
                            <Box>
                              <Typography fontWeight={850}>{item.title}</Typography>
                              <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <Typography variant="body2" color="text.secondary">Already have an account?</Typography>
                <Button component={RouterLink} to="/login" variant="text">Sign in</Button>
              </Stack>
            </Stack>
          </Box>
        ) : null}

        {activeStep === 0 ? <Divider /> : null}

        <Stack spacing={3.5} component="form" onSubmit={submit} noValidate sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ display: { xs: 'none', md: 'flex' }, maxWidth: 760, mx: 'auto', width: '100%' }}>
            {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          <LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ display: { md: 'none' } }} />
          {submitMutation.isError ? <Alert severity="error">{getErrorMessage(submitMutation.error)}</Alert> : null}
          {validationQuery.data ? (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
              <Chip color={validationQuery.data.companyNameAvailable ? 'success' : 'error'} label={validationQuery.data.companyNameAvailable ? 'Company name available' : 'Company name already exists'} />
              <Chip color={validationQuery.data.registrationNumberAvailable ? 'success' : 'error'} label={validationQuery.data.registrationNumberAvailable ? 'Registration number available' : 'Registration number already exists'} />
              <Chip color={validationQuery.data.taxNumberAvailable ? 'success' : 'error'} label={validationQuery.data.taxNumberAvailable ? 'Tax number available' : 'Tax number already exists'} />
              <Chip color={validationQuery.data.adminEmailAvailable ? 'success' : 'error'} label={validationQuery.data.adminEmailAvailable ? 'Administrator email available' : 'Administrator email already exists'} />
            </Stack>
          ) : null}

          {activeStep === 0 ? (
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.75} alignItems="center">
                <BusinessOutlinedIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h5" fontWeight={850}>Company information</Typography>
                  <Typography variant="body2" color="text.secondary">Legal identity and contact data.</Typography>
                </Box>
              </Stack>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 5 }}><Controller name="companyName" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Company name" placeholder="Enter company name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} /></Grid>
                <Grid size={{ xs: 12, md: 3.5 }}><Controller name="registrationNumber" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Registration number" placeholder="Enter registration number" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message || 'Checked on submit'} />} /></Grid>
                <Grid size={{ xs: 12, md: 3.5 }}><Controller name="taxNumber" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Tax number" placeholder="Enter tax number" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message || 'Checked on submit'} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller name="companyEmail" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Company email (auto-generated)" fullWidth disabled error={!!fieldState.error} helperText={fieldState.error?.message || 'Generated as contact@company.countryCode and finalized by backend.'} InputProps={{ endAdornment: <InputAdornment position="end"><Tooltip title="Generated automatically and submitted with the request"><InfoOutlinedIcon fontSize="small" /></Tooltip></InputAdornment> }} />
                  )} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller name="companyPhoneNumber" control={form.control} render={({ field, fieldState }) => (
                    <TextField {...field} label="Company phone" placeholder="641234567" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message || 'Enter only the remaining digits, without the country calling code.'} InputProps={{ startAdornment: country?.phoneCode ? <InputAdornment position="start">+{country.phoneCode}</InputAdornment> : undefined }} />
                  )} />
                </Grid>
              </Grid>
            </Stack>
          ) : null}

          {activeStep === 1 ? (
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.75} alignItems="center">
                <LocationOnOutlinedIcon color="primary" fontSize="large" />
                <Box><Typography variant="h5" fontWeight={850}>Location information</Typography><Typography variant="body2" color="text.secondary">Address and regional settings.</Typography></Box>
              </Stack>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 4 }}><Controller name="countryId" control={form.control} render={({ field, fieldState }) => <TextField {...field} select label="Country" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} onChange={(e) => { field.onChange(Number(e.target.value)); form.setValue('cityId', 0); form.setValue('timezoneId', 0); }}>{countryOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Controller name="cityId" control={form.control} render={({ field, fieldState }) => <TextField {...field} select label="City" fullWidth disabled={!selectedCountryId} error={!!fieldState.error} helperText={fieldState.error?.message}>{cityOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Controller name="timezoneId" control={form.control} render={({ field, fieldState }) => <TextField {...field} select label="Timezone" fullWidth disabled={!selectedCountryId} error={!!fieldState.error} helperText={fieldState.error?.message}>{timezoneOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>} /></Grid>
                <Grid size={{ xs: 12, md: 8 }}><Controller name="address" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Address" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Controller name="postalCode" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Postal code" value={city?.postalCode ?? ''} fullWidth disabled helperText={fieldState.error?.message} />} /></Grid>
              </Grid>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={country?.name ?? 'Country preview'} />
                <Chip label={timezone?.displayName ?? timezone?.name ?? 'Timezone preview'} />
                <Chip label={country?.currencyCode ?? 'Currency preview'} />
                <Chip label={country?.phoneCode ? `${country.phoneCode}` : 'Phone code preview'} />
              </Stack>
            </Stack>
          ) : null}

          {activeStep === 2 ? (
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.75} alignItems="center"><AdminPanelSettingsOutlinedIcon color="primary" fontSize="large" /><Box><Typography variant="h5" fontWeight={850}>Administrator account</Typography><Typography variant="body2" color="text.secondary">Initial company administrator credentials.</Typography></Box></Stack>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminFirstName" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="First name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminLastName" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Last name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminAddress" control={form.control} render={({ field, fieldState }) => ( <TextField {...field} label="Administrator address" fullWidth required error={Boolean(fieldState.error)} helperText={fieldState.error?.message ?? 'Personal address of the initial company administrator.'} /> )} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminEmail" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Admin email (auto-generated)" fullWidth disabled error={!!fieldState.error} helperText={fieldState.error?.message || 'Generated as first.last@company.role.countryCode and finalized by backend.'} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminPhoneNumber" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Admin phone" placeholder="641234567" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message || 'Enter only the remaining digits, without the country calling code.'} InputProps={{ startAdornment: country?.phoneCode ? <InputAdornment position="start">{country.phoneCode}</InputAdornment> : undefined }} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminJmbg" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Admin JMBG" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Controller name="adminEmploymentDate" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Employment date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!fieldState.error} helperText={fieldState.error?.message} />} /></Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller name="adminPassword" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Password" type="password" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                  <LinearProgress variant="determinate" value={(score / 4) * 100} sx={{ mt: 1 }} />
                  <Typography variant="caption" color="text.secondary">Password strength: {score <= 1 ? 'Weak' : score <= 3 ? 'Medium' : 'Strong'} · 8+ chars, uppercase, number, special char</Typography>
                </Grid>
              </Grid>
            </Stack>
          ) : null}

          {activeStep === 3 ? (
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.75} alignItems="center"><FactCheckOutlinedIcon color="primary" fontSize="large" /><Box><Typography variant="h5" fontWeight={850}>Review and submit</Typography><Typography variant="body2" color="text.secondary">Confirm the request before sending it for approval.</Typography></Box></Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}><Card variant="outlined"><CardContent><Stack spacing={1}><Typography fontWeight={850}>Company</Typography><SummaryRow label="Name" value={values.companyName} /><SummaryRow label="Registration" value={values.registrationNumber} /><SummaryRow label="Tax" value={values.taxNumber} /><SummaryRow label="Email" value={values.companyEmail} /><Button size="small" onClick={() => setActiveStep(0)}>Edit</Button></Stack></CardContent></Card></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Card variant="outlined"><CardContent><Stack spacing={1}><Typography fontWeight={850}>Location</Typography><SummaryRow label="Country" value={country?.name} /><SummaryRow label="City" value={city?.name} /><SummaryRow label="Timezone" value={timezone?.displayName ?? timezone?.name} /><SummaryRow label="Phone code" value={country?.phoneCode ? `+${country.phoneCode}` : null} /><Button size="small" onClick={() => setActiveStep(1)}>Edit</Button></Stack></CardContent></Card></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Card variant="outlined"><CardContent><Stack spacing={1}><Typography fontWeight={850}>Administrator</Typography><SummaryRow label="Name" value={`${values.adminFirstName ?? ''} ${values.adminLastName ?? ''}`.trim()} /><SummaryRow label="Admin address" value={values.adminAddress} /><SummaryRow label="Email" value={values.adminEmail} /><SummaryRow label="Phone" value={country?.phoneCode ? `+${country.phoneCode} ${values.adminPhoneNumber ?? ''}` : values.adminPhoneNumber} /><Button size="small" onClick={() => setActiveStep(2)}>Edit</Button></Stack></CardContent></Card></Grid>
              </Grid>
              <Controller name="notes" control={form.control} render={({ field, fieldState }) => <TextField {...field} label="Additional notes" multiline minRows={3} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} />
              <Stack direction="row" spacing={1} alignItems="center"><Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /><Typography variant="body2">I confirm that submitted information is accurate.</Typography></Stack>
            </Stack>
          ) : null}

          <Divider />
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ position: { xs: 'sticky', md: 'static' }, bottom: 0, bgcolor: 'background.paper', py: 1.5, px: 1, borderTop: '1px solid', borderColor: 'divider', zIndex: 2 }}>
            <Button disabled={activeStep === 0 || submitMutation.isPending} onClick={() => setActiveStep((step) => step - 1)}>Back</Button>
            {activeStep < steps.length - 1
              ? <Button variant="contained" onClick={goNext} endIcon={<ArrowForwardRoundedIcon />}>Next</Button>
              : <Button type="submit" variant="contained" disabled={!confirmed || submitMutation.isPending}>{submitMutation.isPending ? 'Submitting...' : 'Submit request'}</Button>}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
