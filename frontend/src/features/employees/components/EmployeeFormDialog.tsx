import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import FormActions from '../../../shared/components/Form/FormActions';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import FormTextField from '../../../shared/components/Form/Form';
import type { CompanyResponse } from '../../companies/types/company.types';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { getSalaryCurrencyCode } from '../../../core/utils/formatSalary';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import type {
  EmployeeResponse,
  EmployeeRoleOption,
  EmployeeUserOption,
} from '../types/employee.types';
import {
  getEmployeeFormSchema,
  type EmployeeFormValues,
  userStatusOptions,
} from '../validation/employeeSchema';

type EmployeeFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: EmployeeResponse | null;
  linkedUser?: EmployeeUserOption | null;
  roles: EmployeeRoleOption[];
  companies: CompanyResponse[];
  companyName?: string | null;
  isOverlord?: boolean;
  loading?: boolean;
  serverError?: unknown;
  canEdit?: boolean;
  canManageLinkedUserSecurity?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
};

const userStatusSelectOptions = userStatusOptions.map((status) => ({
  value: status,
  label: status,
}));

const defaultValues: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  jmbg: '',
  phoneNumber: '',
  email: '',
  position: 'WORKER',
  employmentDate: '',
  salary: '',
  password: '',
  status: 'ACTIVE',
  enabled: true,
  address: '',
  countryId: null,
  cityId: null,
  city: '',
  postalCode: '',
  timezoneId: null,
  primaryWarehouseId: null,
  companyId: '',
  applyGeneratedEmailSuggestion: false,
};

function normalizeForEmail(value: string, allowHyphen: boolean) {
  let normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  normalized = allowHyphen
    ? normalized.replace(/[^a-z0-9]+/g, '-')
    : normalized.replace(/[^a-z0-9]+/g, '.');

  normalized = normalized
    .replace(/[-.]{2,}/g, allowHyphen ? '-' : '.')
    .replace(/^[-.]+|[-.]+$/g, '');

  return normalized;
}

function buildEmail(
  firstName: string,
  lastName: string,
  companyName?: string | null,
  position?: string,
  countryCode?: string | null,
) {
  const localPart = [
    normalizeForEmail(firstName, false),
    normalizeForEmail(lastName, false),
  ]
    .filter(Boolean)
    .join('.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  const companyPart = normalizeForEmail(companyName ?? 'company', true) || 'company';
  const positionPart = normalizeForEmail(position ?? 'worker', true) || 'worker';
  const countryPart = normalizeForEmail(countryCode ?? '', true) || 'country';

  if (!localPart) {
    return '';
  }

  return `${localPart}@${companyPart}.${positionPart}.${countryPart}`;
}

export default function EmployeeFormDialog({
  open,
  mode,
  initialData,
  linkedUser = null,
  roles,
  companies,
  companyName = null,
  isOverlord = false,
  loading = false,
  serverError = null,
  canEdit = true,
  canManageLinkedUserSecurity = false,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const [selectedPrimaryWarehouse, setSelectedPrimaryWarehouse] = useState<LookupOption | null>(null);
  const hasLinkedUser = mode === 'edit' && Boolean(linkedUser);
  const countriesQuery = useActiveCountries(open);
  const previousCountryIdRef = useRef<number | null>(null);
  const requireCompany = mode === 'create' && isOverlord;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(getEmployeeFormSchema(mode, hasLinkedUser, requireCompany)) as never,
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open || !serverError) {
      return;
    }

    applyServerFieldErrors(serverError, form.setError);
  }, [form, open, serverError]);

  const firstName = useWatch({ control: form.control, name: 'firstName' });
  const lastName = useWatch({ control: form.control, name: 'lastName' });
  const selectedPosition = useWatch({ control: form.control, name: 'position' });
  const selectedCompanyId = useWatch({ control: form.control, name: 'companyId' });
  const selectedCountryId = useWatch({ control: form.control, name: 'countryId' });
  const selectedCityId = useWatch({ control: form.control, name: 'cityId' });
  const citiesQuery = useCitiesByCountry(Number(selectedCountryId) || null, open && Boolean(selectedCountryId));

  const positionOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.name,
        label: role.name,
      })),
    [roles],
  );

  const countryOptions = useMemo(
    () => (countriesQuery.data ?? []).map((country) => ({
      value: country.id,
      label: `${country.name} (${country.iso2Code})`,
    })),
    [countriesQuery.data],
  );

  const selectedCountry = useMemo(
    () => (countriesQuery.data ?? []).find((country) => country.id === Number(selectedCountryId)),
    [countriesQuery.data, selectedCountryId],
  );

  const cityOptions = useMemo(
    () => (citiesQuery.data ?? []).map((city) => ({
      value: city.id,
      label: city.postalCode ? `${city.name} (${city.postalCode})` : city.name,
    })),
    [citiesQuery.data],
  );

  const selectedCity = useMemo(
    () => (citiesQuery.data ?? []).find((city) => city.id === Number(selectedCityId)),
    [citiesQuery.data, selectedCityId],
  );

  const timezoneOptions = useMemo(
    () => selectedCountry?.timezones?.map((timezone) => ({
      value: timezone.id,
      label: `${timezone.displayName} (${timezone.name})`,
    })) ?? [],
    [selectedCountry],
  );

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        value: String(company.id),
        label: company.name,
      })),
    [companies],
  );

  const selectedCompanyName = useMemo(() => {
    if (mode !== 'create') {
      return companyName;
    }

    if (!isOverlord) {
      return companyName;
    }

    const selectedCompany = companies.find(
      (company) => String(company.id) === String(selectedCompanyId),
    );

    return selectedCompany?.name ?? null;
  }, [companies, companyName, isOverlord, mode, selectedCompanyId]);

  const selectedCompanyCountryCode = useMemo(() => {
    if (mode !== 'create') {
      return selectedCountry?.iso2Code ?? initialData?.countryCode ?? null;
    }

    if (!isOverlord) {
      return selectedCountry?.iso2Code ?? null;
    }

    const selectedCompany = companies.find(
      (company) => String(company.id) === String(selectedCompanyId),
    );

    return selectedCompany?.countryCode ?? selectedCountry?.iso2Code ?? null;
  }, [companies, initialData?.countryCode, isOverlord, mode, selectedCompanyId, selectedCountry?.iso2Code]);

  const salaryCurrencyCode = useMemo(() => {
    if (selectedCountry?.currencyCode) {
      return getSalaryCurrencyCode(selectedCountry.currencyCode);
    }

    if (mode !== 'create' && initialData?.salaryCurrencyCode) {
      return getSalaryCurrencyCode(initialData.salaryCurrencyCode);
    }

    if (isOverlord) {
      const selectedCompany = companies.find(
        (company) => String(company.id) === String(selectedCompanyId),
      );
      return getSalaryCurrencyCode(selectedCompany?.effectiveCurrencyCode ?? selectedCompany?.currencyCode);
    }

    return getSalaryCurrencyCode(null);
  }, [companies, initialData?.salaryCurrencyCode, isOverlord, mode, selectedCompanyId, selectedCountry?.currencyCode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        jmbg: initialData.jmbg,
        phoneNumber: initialData.phoneNumber,
        email: initialData.email,
        position: initialData.position,
        employmentDate: initialData.employmentDate,
        salary: String(initialData.salary),
        address: initialData.address ?? '',
        countryId: initialData.countryId ?? null,
        cityId: initialData.cityId ?? null,
        city: initialData.cityName ?? initialData.city ?? '',
        postalCode: initialData.postalCode ?? '',
        timezoneId: initialData.timezoneId ?? null,
        primaryWarehouseId: initialData.primaryWarehouseId ?? null,
        password: '',
        status: linkedUser?.status ?? 'ACTIVE',
        enabled: linkedUser?.enabled ?? true,
        companyId: initialData.companyId != null ? String(initialData.companyId) : '',
        applyGeneratedEmailSuggestion: false,
      });
      setSelectedPrimaryWarehouse(
        initialData.primaryWarehouseId
          ? {
              id: initialData.primaryWarehouseId,
              label: initialData.primaryWarehouseName ?? `Warehouse #${initialData.primaryWarehouseId}`,
            }
          : null,
      );
      return;
    }

    form.reset(defaultValues);
    setSelectedPrimaryWarehouse(null);
  }, [form, initialData, linkedUser, mode, open]);

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
      form.setValue('cityId', null, { shouldDirty: true, shouldValidate: true });
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
    if (!form.getValues('timezoneId')) {
      form.setValue('timezoneId', selectedCountry.defaultTimezoneId, { shouldDirty: true, shouldValidate: true });
    }
  }, [form, open, selectedCountry?.defaultTimezoneId]);

  useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    if (form.getValues('applyGeneratedEmailSuggestion')) {
      return;
    }

    const nextEmail = buildEmail(
      firstName ?? '',
      lastName ?? '',
      selectedCompanyName,
      selectedPosition,
      selectedCompanyCountryCode,
    );
    form.setValue('email', nextEmail, { shouldDirty: true, shouldValidate: true });
  }, [firstName, form, lastName, mode, selectedCompanyCountryCode, selectedCompanyName, selectedPosition]);

  const suggestedGeneratedEmail = mode === 'edit' ? initialData?.suggestedGeneratedEmail ?? null : null;
  const showGeneratedEmailSuggestion = mode === 'edit'
    && canEdit
    && Boolean(suggestedGeneratedEmail)
    && suggestedGeneratedEmail?.toLowerCase() !== form.getValues('email').toLowerCase();

  const disableSubmit = loading || !form.formState.isValid || (mode === 'edit' && !canEdit);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create employee' : 'Edit employee'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Create or update the employee profile and linked user account data.
          </Typography>

          <Typography variant="subtitle2" fontWeight={700}>
            Personal info
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="firstName" control={form.control} label="First name" required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="lastName" control={form.control} label="Last name" required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="jmbg" control={form.control} label="JMBG" required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="phoneNumber" control={form.control} label="Phone number" helperText="Enter only the remaining digits, without the country calling code." required />
            </Grid>

          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Location
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="countryId"
                control={form.control}
                label="Country"
                options={countryOptions}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="cityId"
                control={form.control}
                label="City"
                options={cityOptions}
                disabled={!selectedCountryId || citiesQuery.isLoading || cityOptions.length === 0 || (mode === 'edit' && !canEdit)}
                helperText={!selectedCountryId ? 'Select country first' : undefined}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextField
                name="address"
                control={form.control}
                label="Address"
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="postalCode"
                control={form.control}
                label="Postal code"
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="timezoneId"
                control={form.control}
                label="Timezone"
                options={timezoneOptions}
                disabled={!selectedCountryId || timezoneOptions.length === 0 || (mode === 'edit' && !canEdit)}
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Employment
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="position"
                control={form.control}
                label="Role"
                options={positionOptions}
                required
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormDatePicker
                name="employmentDate"
                control={form.control}
                label="Employment date"
                inputType="date"
                required
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="salary"
                control={form.control}
                label="Salary"
                type="number"
                required
                disabled={mode === 'edit' && !canEdit}
                helperText={`Currency: ${salaryCurrencyCode}`}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">{salaryCurrencyCode}</InputAdornment>,
                  },
                  htmlInput: {
                    min: 0,
                    step: '0.01',
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <EntityLookupField
                label="Primary warehouse"
                entityType="warehouses"
                value={selectedPrimaryWarehouse}
                onChange={(option) => {
                  setSelectedPrimaryWarehouse(option);
                  form.setValue('primaryWarehouseId', option?.id ?? null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                required={selectedPosition === 'WORKER'}
                disabled={mode === 'edit' && !canEdit}
                error={Boolean(form.formState.errors.primaryWarehouseId)}
                helperText={form.formState.errors.primaryWarehouseId?.message ?? (selectedPosition === 'WORKER' ? 'Required for WORKER operational scope' : 'Optional base/operational warehouse')}
                placeholder="Choose primary warehouse"
                searchPlaceholder="Search warehouses..."
                sort="name,asc"
                activeOnly
              />
            </Grid>

          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            User account
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="email"
                control={form.control}
                label="Email"
                required
                helperText={initialData?.emailGenerationSource ? `Source: ${initialData.emailGenerationSource}` : 'Generated from employee and company data'}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>

            {showGeneratedEmailSuggestion ? (
              <Grid size={{ xs: 12 }}>
                <Alert
                  severity="info"
                  action={
                    <Button
                      size="small"
                      onClick={() => {
                        form.setValue('email', suggestedGeneratedEmail ?? '', { shouldDirty: true, shouldValidate: true });
                        form.setValue('applyGeneratedEmailSuggestion', true, { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      Update generated email
                    </Button>
                  }
                >
                  Suggested generated email: {suggestedGeneratedEmail}
                </Alert>
              </Grid>
            ) : null}

            {mode === 'create' && isOverlord ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormSelect
                  name="companyId"
                  control={form.control}
                  label="Company"
                  options={companyOptions}
                  required
                />
              </Grid>
            ) : null}

            {mode === 'create' ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField
                  name="password"
                  control={form.control}
                  label="Password"
                  type="password"
                  required
                />
              </Grid>
            ) : null}

            {hasLinkedUser && canEdit && canManageLinkedUserSecurity ? (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="status"
                    control={form.control}
                    label="Account status"
                    options={userStatusSelectOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormCheckbox name="enabled" control={form.control} label="Account enabled" />
                </Grid>
              </>
            ) : null}
          </Grid>
        </Stack>
      </DialogContent>

      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel={mode === 'create' ? 'Create employee' : 'Save changes'}
          submittingLabel={mode === 'create' ? 'Creating employee...' : 'Saving changes...'}
          helperText="Employee and account fields must be valid before saving."
          loading={loading}
          submitDisabled={disableSubmit && !loading}
          onCancel={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </DialogContent>
    </Dialog>
  );
}