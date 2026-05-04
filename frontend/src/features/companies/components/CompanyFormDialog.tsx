import { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormTextField from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import type { CompanyResponse } from '../types/company.types';
import {
  buildBootstrapAdminPreview,
  companySchema,
  type CompanySchemaValues,
} from '../validation/companySchema';

type CompanyFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: CompanyResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CompanySchemaValues) => void;
};

const defaultValues: CompanySchemaValues = {
  name: '',
  active: true,
  countryId: 0,
  timezoneId: 0,
  address: '',
  cityId: 0,
  city: '',
  postalCode: '',
  phoneNumber: '',
  email: '',
  taxNumber: '',
  registrationNumber: '',
  adminFirstName: '',
  adminLastName: '',
  adminPassword: '',
  adminJmbg: '',
  adminPhoneNumber: '',
  adminEmploymentDate: '',
};

export default function CompanyFormDialog({
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: CompanyFormDialogProps) {
  const countriesQuery = useActiveCountries(open);
  const previousCountryIdRef = useRef<number | null>(null);

  const countryOptions = useMemo(
    () => (countriesQuery.data ?? []).map((country) => ({
      label: `${country.name} (${country.iso2Code})`,
      value: country.id,
    })),
    [countriesQuery.data],
  );

  const form = useForm<CompanySchemaValues>({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        ...defaultValues,
        name: initialData.name,
        active: initialData.active,
        countryId: initialData.countryId ?? 0,
        timezoneId: initialData.timezoneId ?? 0,
        address: initialData.address ?? '',
        cityId: initialData.cityId ?? 0,
        city: initialData.cityName ?? initialData.city ?? '',
        postalCode: initialData.postalCode ?? '',
        phoneNumber: initialData.phoneNumber ?? '',
        email: initialData.email ?? '',
        taxNumber: initialData.taxNumber ?? '',
        registrationNumber: initialData.registrationNumber ?? '',
      });
      return;
    }

    form.reset(defaultValues);
  }, [form, initialData, mode, open]);

  const selectedCountryId = useWatch({ control: form.control, name: 'countryId' });
  const selectedCityId = useWatch({ control: form.control, name: 'cityId' });
  const citiesQuery = useCitiesByCountry(Number(selectedCountryId) || null, open && Boolean(selectedCountryId));

  const selectedCountry = useMemo(
    () => (countriesQuery.data ?? []).find((country) => country.id === Number(selectedCountryId)),
    [countriesQuery.data, selectedCountryId],
  );

  const cityOptions = useMemo(
    () => (citiesQuery.data ?? []).map((city) => ({
      label: city.postalCode ? `${city.name} (${city.postalCode})` : city.name,
      value: city.id,
    })),
    [citiesQuery.data],
  );

  const selectedCity = useMemo(
    () => (citiesQuery.data ?? []).find((city) => city.id === Number(selectedCityId)),
    [citiesQuery.data, selectedCityId],
  );

  const timezoneOptions = useMemo(
    () => selectedCountry?.timezones?.map((timezone) => ({
      label: timezone.displayName + " (" + timezone.name + ")",
      value: timezone.id,
    })) ?? [],
    [selectedCountry],
  );

  useEffect(() => {
    if (!open) {
      previousCountryIdRef.current = null;
      return;
    }

    const currentCountryId = Number(selectedCountryId) || null;
    if (previousCountryIdRef.current === null) {
      previousCountryIdRef.current = currentCountryId;
      return;
    }

    if (previousCountryIdRef.current !== currentCountryId) {
      form.setValue('cityId', 0, { shouldDirty: true, shouldValidate: true });
      form.setValue('city', '', { shouldDirty: true, shouldValidate: true });
      previousCountryIdRef.current = currentCountryId;
    }
  }, [form, open, selectedCountryId]);

  useEffect(() => {
    if (!open || !selectedCity) {
      return;
    }
    form.setValue('city', selectedCity.name, { shouldDirty: true, shouldValidate: true });
    if (selectedCity.postalCode && !form.getValues('postalCode')) {
      form.setValue('postalCode', selectedCity.postalCode, { shouldDirty: true, shouldValidate: true });
    }
  }, [form, open, selectedCity]);

  useEffect(() => {
    if (!open || !selectedCountry?.defaultTimezoneId) {
      return;
    }
    const currentTimezoneId = form.getValues('timezoneId');
    if (!currentTimezoneId || mode === 'create') {
      form.setValue('timezoneId', selectedCountry.defaultTimezoneId);
    }
  }, [form, mode, open, selectedCountry?.defaultTimezoneId]);

  const companyName = useWatch({ control: form.control, name: 'name' });
  const adminFirstName = useWatch({ control: form.control, name: 'adminFirstName' });
  const adminLastName = useWatch({ control: form.control, name: 'adminLastName' });

  const preview = useMemo(
    () =>
      buildBootstrapAdminPreview(
        companyName ?? '',
        adminFirstName ?? '',
        adminLastName ?? '',
        selectedCountry?.iso2Code ?? null,
      ),
    [adminFirstName, adminLastName, companyName, selectedCountry?.iso2Code],
  );

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create company' : 'Edit company'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {mode === 'create' ? (
            <Alert severity="info">
              Creating a company automatically creates the initial COMPANY_ADMIN user and linked employee profile.
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Company data
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormTextField
                  name="name"
                  control={form.control}
                  label="Company name"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormSelect
                  name="countryId"
                  control={form.control}
                  label="Country"
                  options={countryOptions}
                  required
                  disabled={countriesQuery.isLoading}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormSelect
                  name="timezoneId"
                  control={form.control}
                  label="Timezone"
                  options={timezoneOptions}
                  required
                  disabled={!selectedCountryId || timezoneOptions.length === 0}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="address" control={form.control} label="Address" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormSelect
                  name="cityId"
                  control={form.control}
                  label="City"
                  options={cityOptions}
                  required
                  disabled={!selectedCountryId || citiesQuery.isLoading || cityOptions.length === 0}
                  helperText={!selectedCountryId ? 'Select country first' : undefined}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="postalCode" control={form.control} label="Postal code" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="phoneNumber" control={form.control} label="Phone number" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="email" control={form.control} label="Company email" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="taxNumber" control={form.control} label="Tax number" />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="registrationNumber" control={form.control} label="Registration number" />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormCheckbox
                  name="active"
                  control={form.control}
                  label="Company is active"
                />
              </Grid>
            </Grid>
          </Stack>

          {mode === 'create' ? (
            <>
              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Initial company admin
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminFirstName"
                      control={form.control}
                      label="First name"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminLastName"
                      control={form.control}
                      label="Last name"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminPassword"
                      control={form.control}
                      label="Password"
                      type="password"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminJmbg"
                      control={form.control}
                      label="JMBG"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminPhoneNumber"
                      control={form.control}
                      label="Phone number"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormDatePicker
                      name="adminEmploymentDate"
                      control={form.control}
                      label="Employment date"
                      inputType="date"
                      required
                    />
                  </Grid>
                </Grid>

                <Alert severity="success" variant="outlined">
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Assigned role:</strong> {preview.role}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assigned user status:</strong> {preview.status}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assigned employee position:</strong> {preview.position}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Generated username:</strong> {preview.username}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Generated email:</strong> {preview.email}
                    </Typography>
                  </Stack>
                </Alert>
              </Stack>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={form.handleSubmit((values) => onSubmit(values))}
          disabled={loading}
        >
          {mode === 'create' ? 'Create company' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
