import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from '@mui/material';
import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Form from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormActions from '../../../shared/components/Form/FormActions';
import FormSection from '../../../shared/components/Form/FormSection';
import type { CompanyResponse } from '../../companies/types/company.types';
import { useCitiesByCountry } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import type {
  WarehouseEmployeeOption,
  WarehouseFormValues,
  WarehouseResponse,
} from '../types/warehouse.types';
import { warehouseSchema } from '../validation/warehouseSchema';

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

const defaultValues: WarehouseFormValues = {
  name: '',
  address: '',
  cityId: '',
  city: '',
  postalCode: '',
  countryId: null,
  timezoneId: '',
  capacity: '',
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
  const { control, handleSubmit, reset, setValue, getValues, formState } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues,
    mode: 'onChange',
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
        <Stack spacing={2} sx={{ pt: 1 }}>
        <FormSection title="Location and capacity" description="Define the physical warehouse location, timezone and operational capacity.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><Form name="name" control={control} label="Name" required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="cityId" control={control} label="City" options={cityOptions} required disabled={!selectedCountryId || citiesQuery.isLoading || cityOptions.length === 0} helperText={!selectedCountryId ? 'Select country first' : undefined} /></Grid>
          <Grid size={{ xs: 12 }}><Form name="address" control={control} label="Address" required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Form name="postalCode" control={control} label="Postal code" /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Form name="capacity" control={control} label="Capacity" type="number" required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="countryId" control={control} label="Country" options={countryOptions} required /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><FormSelect name="timezoneId" control={control} label="Timezone" options={timezoneOptions} required disabled={!selectedCountryId || timezoneOptions.length === 0} /></Grid>
        </Grid>
        </FormSection>

        <FormSection title="Operational setup" description="Set the warehouse's initial operating status.">
        <Grid container spacing={2}>
          {mode === 'create' && isOverlord ? <Grid size={{ xs: 12, md: 6 }}><FormSelect name="companyId" control={control} label="Company" options={companyOptions} required /></Grid> : null}
          <Grid size={{ xs: 12 }}><FormSelect name="employeeId" control={control} label="Manager" options={visibleManagers.map((manager) => ({ value: manager.id, label: `${manager.firstName} ${manager.lastName}` }))} required disabled={mode === 'edit' || (mode === 'create' && isOverlord && !selectedCompanyId)} helperText={mode === 'create' && isOverlord && !selectedCompanyId ? 'Select company first' : undefined} /></Grid>
        </Grid>
        </FormSection>

        <FormActions
          cancelLabel="Cancel"
          submitLabel={mode === 'create' ? 'Create warehouse' : 'Save warehouse'}
          submittingLabel="Saving..."
          helperText="Cancel closes the form without saving."
          loading={loading}
          onCancel={onClose}
          submitDisabled={!formState.isValid || (mode === 'create' && isOverlord && !selectedCompanyId)}
          onSubmit={handleSubmit(onSubmit)}
        />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
