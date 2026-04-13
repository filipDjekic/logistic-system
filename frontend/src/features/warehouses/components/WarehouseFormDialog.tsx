import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Form from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
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
  city: '',
  capacity: '',
  status: 'ACTIVE',
  employeeId: '',
};

export default function WarehouseFormDialog({
  open,
  mode,
  initialData,
  managers,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const { control, handleSubmit, reset } = useForm<WarehouseFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        address: initialData.address,
        city: initialData.city,
        capacity: initialData.capacity,
        status: initialData.status,
        employeeId: initialData.employeeId ?? '',
      });
      return;
    }

    reset(defaultValues);
  }, [initialData, mode, open, reset]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create warehouse' : 'Edit warehouse'}</DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="name" control={control} label="Name" required />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="city" control={control} label="City" required />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Form name="address" control={control} label="Address" required />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="capacity" control={control} label="Capacity" type="number" required />
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

          <Grid size={{ xs: 12 }}>
            <FormSelect
              name="employeeId"
              control={control}
              label="Manager"
              options={managers.map((manager) => ({
                value: manager.id,
                label: `${manager.firstName} ${manager.lastName}`,
              }))}
              required
              disabled={mode === 'edit'}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}