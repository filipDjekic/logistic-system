import { useEffect } from 'react';
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

const defaultValues: VehicleSchemaValues = {
  registrationNumber: '',
  brand: '',
  model: '',
  type: '',
  capacity: 0,
  fuelType: '',
  yearOfProduction: 1990,
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

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        registrationNumber: initialData.registrationNumber,
        brand: initialData.brand,
        model: initialData.model,
        type: initialData.type,
        capacity: initialData.capacity,
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
              <FormTextField
                name="brand"
                control={form.control}
                label="Brand"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="model"
                control={form.control}
                label="Model"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="type"
                control={form.control}
                label="Type"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="fuelType"
                control={form.control}
                label="Fuel type"
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