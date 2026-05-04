import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWatch } from 'react-hook-form';
import { vehiclesApi } from '../api/vehiclesApi';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import type { CompanyResponse } from '../../companies/types/company.types';
import type { VehicleResponse, VehicleStatus } from '../types/vehicle.types';
import {
  vehicleSchema,
  vehicleStatusOptions,
  type VehicleSchemaValues,
} from '../validation/vehicleSchema';
import { fuelTypeOptions, vehicleTypeOptions } from '../types/vehicle.types';

type VehicleFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: VehicleResponse | null;
  companies: CompanyResponse[];
  showCompanySelect: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: VehicleSchemaValues) => void;
};

const statusOptions = vehicleStatusOptions.map((status: VehicleStatus) => ({
  value: status,
  label: status,
}));

const typeOptions = vehicleTypeOptions.map((type) => ({
  value: type,
  label: type,
}));

const fuelOptions = fuelTypeOptions.map((fuelType) => ({
  value: fuelType,
  label: fuelType,
}));

const defaultValues: VehicleSchemaValues = {
  registrationNumber: '',
  vehicleBrandId: '',
  vehicleModelId: '',
  type: '',
  capacity: '',
  maxWeight: '',
  maxVolume: '',
  maxItems: '',
  fuelType: '',
  yearOfProduction: '',
  status: 'AVAILABLE',
  companyId: '',
};

export default function VehicleFormDialog({
  open,
  mode,
  initialData,
  companies,
  showCompanySelect,
  loading = false,
  onClose,
  onSubmit,
}: VehicleFormDialogProps) {
  const form = useForm<VehicleSchemaValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues,
  });
  const previousBrandIdRef = useRef<string>('');

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        registrationNumber: initialData.registrationNumber,
        vehicleBrandId: initialData.vehicleBrandId != null ? String(initialData.vehicleBrandId) : '',
        vehicleModelId: initialData.vehicleModelId != null ? String(initialData.vehicleModelId) : '',
        type: initialData.type,
        capacity: initialData.capacity,
        maxWeight: initialData.maxWeight,
        maxVolume: initialData.maxVolume ?? '',
        maxItems: initialData.maxItems ?? '',
        fuelType: initialData.fuelType,
        yearOfProduction: initialData.yearOfProduction,
        status: initialData.status,
        companyId: initialData.companyId != null ? String(initialData.companyId) : '',
      });

      return;
    }

    form.reset(defaultValues);
  }, [form, initialData, mode, open]);

  const companyOptions = companies.map((company) => ({
    value: String(company.id),
    label: company.name,
  }));

  const selectedBrandId = useWatch({
    control: form.control,
    name: 'vehicleBrandId',
  });

  const brandsQuery = useQuery({
    queryKey: ['vehicle-catalog', 'brands'],
    queryFn: vehiclesApi.getBrands,
    enabled: open,
  });

  const modelsQuery = useQuery({
    queryKey: ['vehicle-catalog', 'models', selectedBrandId],
    queryFn: () => vehiclesApi.getModelsByBrand(Number(selectedBrandId)),
    enabled: open && Boolean(selectedBrandId),
  });

  const brandOptions = useMemo(
    () => (brandsQuery.data ?? []).map((brand) => ({
      value: String(brand.id),
      label: brand.name,
    })),
    [brandsQuery.data],
  );

  const modelOptions = useMemo(
    () => (modelsQuery.data ?? []).map((model) => ({
      value: String(model.id),
      label: model.name,
    })),
    [modelsQuery.data],
  );

  useEffect(() => {
    if (!open) {
      previousBrandIdRef.current = '';
      return;
    }

    if (!selectedBrandId) {
      previousBrandIdRef.current = '';
      form.setValue('vehicleModelId', '');
      return;
    }

    if (previousBrandIdRef.current && previousBrandIdRef.current !== selectedBrandId) {
      form.setValue('vehicleModelId', '');
    }

    previousBrandIdRef.current = selectedBrandId;
  }, [form, open, selectedBrandId]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create vehicle' : 'Edit vehicle'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="registrationNumber"
                control={form.control}
                label="Registration number"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="status"
                control={form.control}
                label="Status"
                options={statusOptions}
                required
              />
            </Grid>

            {mode === 'create' && showCompanySelect ? (
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

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="vehicleBrandId"
                control={form.control}
                label="Brand"
                options={brandOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="vehicleModelId"
                control={form.control}
                label="Model"
                options={modelOptions}
                required
                disabled={!selectedBrandId}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="type"
                control={form.control}
                label="Type"
                options={typeOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="fuelType"
                control={form.control}
                label="Fuel type"
                options={fuelOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="capacity"
                control={form.control}
                label="Capacity"
                type="number"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="maxWeight"
                control={form.control}
                label="Max weight"
                type="number"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="maxVolume"
                control={form.control}
                label="Max volume"
                type="number"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="maxItems"
                control={form.control}
                label="Max items"
                type="number"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="yearOfProduction"
                control={form.control}
                label="Year of production"
                type="number"
                required
              />
            </Grid>
          </Grid>
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
          {mode === 'create' ? 'Create' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}