import { useEffect, useMemo, useRef } from 'react';
import { Button, Grid, Stack, TextField, MenuItem } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import Form from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import PageLoader from '../../../shared/components/Loader/PageLoader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import { EmployeeSearchSelect } from '../../search-select';
import { useCreateWarehouse, useUpdateWarehouse } from '../hooks/useWarehouses';
import { useWarehouse } from '../hooks/useWarehouse';
import type { WarehouseFormValues } from '../types/warehouse.types';

const warehouseStatusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' },
  { value: 'FULL', label: 'FULL' },
  { value: 'UNDER_MAINTENANCE', label: 'UNDER_MAINTENANCE' },
] as const;

const defaultValues: WarehouseFormValues = {
  name: '',
  address: '',
  cityId: '',
  city: '',
  capacity: '',
  status: 'ACTIVE',
  countryId: null,
  timezoneId: '',
  employeeId: '',
  companyId: '',
};

type Props = {
  mode: 'create' | 'edit';
};

export default function WarehouseFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuthStore();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;
  const warehouseId = mode === 'edit' ? Number(params.id) : null;
  const warehouseQuery = useWarehouse(warehouseId);
  const companiesQuery = useCompanies(mode === 'create' && isOverlord);
  const countriesQuery = useActiveCountries(true);
  const previousCountryIdRef = useRef<number | null>(null);
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const { control, handleSubmit, reset, setValue, formState } = useForm<WarehouseFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  const companyId = useWatch({ control, name: 'companyId' });
  const employeeId = useWatch({ control, name: 'employeeId' });
  const countryId = useWatch({ control, name: 'countryId' });
  const cityId = useWatch({ control, name: 'cityId' });

  useEffect(() => {
    if (mode !== 'edit' || !warehouseQuery.data) {
      return;
    }

    reset({
      name: warehouseQuery.data.name,
      address: warehouseQuery.data.address,
      cityId: warehouseQuery.data.cityId ?? '',
      city: warehouseQuery.data.cityName ?? warehouseQuery.data.city ?? '',
      capacity: warehouseQuery.data.capacity,
      status: warehouseQuery.data.status,
      employeeId: warehouseQuery.data.employeeId ?? '',
      companyId: warehouseQuery.data.companyId != null ? String(warehouseQuery.data.companyId) : '',
      countryId: warehouseQuery.data.countryId ?? null,
      timezoneId: warehouseQuery.data.timezoneId ?? '',
    });
  }, [mode, reset, warehouseQuery.data]);

  useEffect(() => {
    if (mode === 'create' && isOverlord) {
      setValue('employeeId', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [companyId, isOverlord, mode, setValue]);

  const citiesQuery = useCitiesByCountry(Number(countryId) || null, Boolean(countryId));
  const selectedCountry = (countriesQuery.data ?? []).find((country) => country.id === Number(countryId));
  const selectedCity = (citiesQuery.data ?? []).find((city) => city.id === Number(cityId));
  const cityOptions = (citiesQuery.data ?? []).map((city) => ({ value: city.id, label: city.postalCode ? `${city.name} (${city.postalCode})` : city.name }));
  const timezoneOptions = selectedCountry?.timezones?.map((timezone) => ({ value: timezone.id, label: timezone.displayName + " (" + timezone.name + ")" })) ?? [];

  useEffect(() => {
    const currentCountryId = Number(countryId) || null;
    if (previousCountryIdRef.current === null) {
      previousCountryIdRef.current = currentCountryId;
      return;
    }
    if (previousCountryIdRef.current !== currentCountryId) {
      setValue('cityId', '', { shouldDirty: true, shouldValidate: true });
      setValue('city', '', { shouldDirty: true, shouldValidate: true });
      previousCountryIdRef.current = currentCountryId;
    }
  }, [countryId, setValue]);

  useEffect(() => {
    if (!selectedCity) {
      return;
    }
    setValue('city', selectedCity.name, { shouldDirty: true, shouldValidate: true });
    if (selectedCity.postalCode) {
      setValue('postalCode', selectedCity.postalCode, { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedCity, setValue]);

  useEffect(() => {
    if (selectedCountry?.defaultTimezoneId) {
      setValue('timezoneId', selectedCountry.defaultTimezoneId, { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedCountry?.defaultTimezoneId, setValue]);

  const selectedEmployeeId = employeeId === '' ? null : Number(employeeId);
  const selectedCompanyId = companyId ? Number(companyId) : undefined;
  const isSaving = createWarehouse.isPending || updateWarehouse.isPending;

  const canSubmit = useMemo(() => {
    if (!formState.isValid || employeeId === '') {
      return false;
    }

    if (mode === 'create' && isOverlord && !companyId) {
      return false;
    }

    return true;
  }, [companyId, employeeId, formState.isValid, isOverlord, mode]);

  if (mode === 'edit' && warehouseQuery.isLoading) {
    return <PageLoader message="Loading warehouse..." />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Storage"
        title={mode === 'create' ? 'Create warehouse' : 'Edit warehouse'}
        description="Warehouse form is a full page and manager selection uses searchable employee results."
        actions={
          <Button variant="outlined" onClick={() => navigate('/warehouses')} disabled={isSaving}>
            Back to warehouses
          </Button>
        }
      />

      <SectionCard title="Warehouse data" description="Enter base warehouse data and select the warehouse manager from filtered employee results.">
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Form name="name" control={control} label="Name" required rules={{ required: 'Name is required', maxLength: { value: 100, message: 'Name must be at most 100 characters' } }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="cityId"
                control={control}
                label="City"
                options={cityOptions}
                required
                disabled={!countryId || citiesQuery.isLoading || cityOptions.length === 0}
                helperText={!countryId ? 'Select country first' : undefined}
                rules={{ required: 'City is required' }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Form name="address" control={control} label="Address" required rules={{ required: 'Address is required', maxLength: { value: 200, message: 'Address must be at most 200 characters' } }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Form name="capacity" control={control} label="Capacity" type="number" required rules={{ required: 'Capacity is required', validate: (value) => Number(value) > 0 || 'Capacity must be greater than 0' }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect name="countryId" control={control} label="Country" options={(countriesQuery.data ?? []).map((country) => ({ value: country.id, label: country.name + " (" + country.iso2Code + ")" }))} required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect name="timezoneId" control={control} label="Timezone" options={timezoneOptions} required disabled={!countryId || timezoneOptions.length === 0} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="status"
                control={control}
                label="Status"
                options={[...warehouseStatusOptions]}
                required
                disabled={mode === 'edit'}
              />
            </Grid>

            {mode === 'create' && isOverlord ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Company"
                  value={companyId}
                  onChange={(event) => setValue('companyId', event.target.value, { shouldDirty: true, shouldValidate: true })}
                  required
                  disabled={companiesQuery.isLoading}
                >
                  {(companiesQuery.data ?? []).map((company) => (
                    <MenuItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
          </Grid>

          <EmployeeSearchSelect
            title="Warehouse manager"
            value={selectedEmployeeId}
            active
            position="WAREHOUSE_MANAGER"
            companyId={mode === 'create' && isOverlord ? selectedCompanyId : undefined}
            onSelect={(employee) => setValue('employeeId', employee.id, { shouldDirty: true, shouldValidate: true })}
            helperText={mode === 'create' && isOverlord && !selectedCompanyId ? 'Select company first, then search warehouse managers.' : 'Search manager by name, email, status or company.'}
            disabled={mode === 'create' && isOverlord && !selectedCompanyId}
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => navigate('/warehouses')} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!canSubmit || isSaving}
              onClick={handleSubmit((values) => {
                if (mode === 'create') {
                  createWarehouse.mutate({
                    name: values.name,
                    address: values.address,
                    cityId: Number(values.cityId),
                    city: values.city ?? null,
                    capacity: Number(values.capacity),
                    status: values.status,
                    countryId: values.countryId ? Number(values.countryId) : null,
                    timezoneId: Number(values.timezoneId),
                    employeeId: Number(values.employeeId),
                    companyId: values.companyId ? Number(values.companyId) : undefined,
                  }, {
                    onSuccess: (created) => navigate(`/warehouses/${created.id}`),
                  });
                  return;
                }

                if (!warehouseId) {
                  return;
                }

                updateWarehouse.mutate({
                  id: warehouseId,
                  data: {
                    name: values.name,
                    address: values.address,
                    cityId: Number(values.cityId),
                    city: values.city ?? null,
                    capacity: Number(values.capacity),
                    countryId: values.countryId ? Number(values.countryId) : null,
                    timezoneId: Number(values.timezoneId),
                  },
                }, {
                  onSuccess: (updated) => navigate(`/warehouses/${updated.id}`),
                });
              })}
            >
              {mode === 'create' ? 'Create warehouse' : 'Save changes'}
            </Button>
          </Stack>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
