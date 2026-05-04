import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from '@mui/material';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Form from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { CompanyResponse } from '../../companies/types/company.types';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import type {
  WarehouseEmployeeOption,
  WarehouseFormValues,
  WarehouseResponse,
} from '../types/warehouse.types';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: WarehouseResponse | null;
  managers: WarehouseEmployeeOption[];
  companies: CompanyResponse[];
  isOverlord: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: WarehouseFormValues) => void;
};

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
  postalCode: '',
  countryId: null,
  timezoneId: '',
  capacity: '',
  status: 'ACTIVE',
  employeeId: '',
  companyId: '',
};

export default function WarehouseFormDialog({
  open,
  mode,
  initialData,
  managers,
  companies,
  isOverlord,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const countriesQuery = useActiveCountries(open);
  const previousCountryIdRef = useRef<number | null>(null);
  const { control, handleSubmit, reset, setValue, getValues } = useForm<WarehouseFormValues>({
    defaultValues,
  });

  const selectedCompanyId = useWatch({ control, name: 'companyId' });
  const selectedCountryId = useWatch({ control, name: 'countryId' });
  const selectedCityId = useWatch({ control, name: 'cityId' });
  const citiesQuery = useCitiesByCountry(Number(selectedCountryId) || null, open && Boolean(selectedCountryId));

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        address: initialData.address,
        cityId: initialData.cityId ?? '',
        city: initialData.cityName ?? initialData.city ?? '',
        postalCode: initialData.postalCode ?? '',
        countryId: initialData.countryId ?? null,
        timezoneId: initialData.timezoneId ?? '',
        capacity: initialData.capacity,
        status: initialData.status,
        employeeId: initialData.employeeId ?? '',
        companyId: initialData.companyId != null ? String(initialData.companyId) : '',
      });
      return;
    }

    reset(defaultValues);
  }, [initialData, mode, open, reset]);

  useEffect(() => {
    if (mode !== 'create' || !isOverlord) return;
    setValue('employeeId', '');
  }, [isOverlord, mode, selectedCompanyId, setValue]);

  const countryOptions = useMemo(
    () => (countriesQuery.data ?? []).map((country) => ({
      value: country.id,
      label: `${country.name} (${country.iso2Code})`,
    })),
    [countriesQuery.data],
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

  const selectedCountry = useMemo(
    () => (countriesQuery.data ?? []).find((country) => country.id === Number(selectedCountryId)),
    [countriesQuery.data, selectedCountryId],
  );

  const timezoneOptions = useMemo(
    () => selectedCountry?.timezones?.map((timezone) => ({
      value: timezone.id,
      label: `${timezone.displayName} (${timezone.name})`,
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
      setValue('cityId', '', { shouldDirty: true, shouldValidate: true });
      setValue('city', '', { shouldDirty: true, shouldValidate: true });
      previousCountryIdRef.current = currentCountryId;
    }
  }, [open, selectedCountryId, setValue]);

  useEffect(() => {
    if (!open || !selectedCity) return;
    setValue('city', selectedCity.name, { shouldDirty: true, shouldValidate: true });
    if (selectedCity.postalCode && !getValues('postalCode')) {
      setValue('postalCode', selectedCity.postalCode, { shouldDirty: true, shouldValidate: true });
    }
  }, [getValues, open, selectedCity, setValue]);

  useEffect(() => {
    if (!open || !selectedCountry?.defaultTimezoneId) return;
    if (!getValues('timezoneId')) {
      setValue('timezoneId', selectedCountry.defaultTimezoneId);
    }
  }, [getValues, open, selectedCountry?.defaultTimezoneId, setValue]);

  const companyOptions = companies.map((company) => ({
    value: String(company.id),
    label: company.name,
  }));

  const visibleManagers = useMemo(() => {
    if (mode !== 'create' || !isOverlord) return managers;
    if (!selectedCompanyId) return [];
    return managers.filter((manager) => String(manager.companyId ?? '') === String(selectedCompanyId));
  }, [isOverlord, managers, mode, selectedCompanyId]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create warehouse' : 'Edit warehouse'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}><Form name="name" control={control} label="Name" required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="cityId" control={control} label="City" options={cityOptions} required disabled={!selectedCountryId || citiesQuery.isLoading || cityOptions.length === 0} helperText={!selectedCountryId ? 'Select country first' : undefined} /></Grid>
          <Grid size={{ xs: 12 }}><Form name="address" control={control} label="Address" required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Form name="postalCode" control={control} label="Postal code" /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Form name="capacity" control={control} label="Capacity" type="number" required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="countryId" control={control} label="Country" options={countryOptions} required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="timezoneId" control={control} label="Timezone" options={timezoneOptions} required disabled={!selectedCountryId || timezoneOptions.length === 0} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="status" control={control} label="Status" options={[...warehouseStatusOptions]} required disabled={mode === 'edit'} /></Grid>
          {mode === 'create' && isOverlord ? <Grid size={{ xs: 12, md: 6 }}><FormSelect name="companyId" control={control} label="Company" options={companyOptions} required /></Grid> : null}
          <Grid size={{ xs: 12 }}><FormSelect name="employeeId" control={control} label="Manager" options={visibleManagers.map((manager) => ({ value: manager.id, label: `${manager.firstName} ${manager.lastName}` }))} required disabled={mode === 'edit' || (mode === 'create' && isOverlord && !selectedCompanyId)} helperText={mode === 'create' && isOverlord && !selectedCompanyId ? 'Select company first' : undefined} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
