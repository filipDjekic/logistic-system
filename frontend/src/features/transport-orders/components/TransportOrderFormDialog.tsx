import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import type {
  EmployeeOption,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';
import {
  transportOrderPriorityOptions,
  transportOrderSchema,
  type TransportOrderSchemaValues,
} from '../validation/transportOrderSchema';

type TransportOrderFormDialogProps = {
  open: boolean;
  warehouses: WarehouseOption[];
  vehicles: VehicleOption[];
  employees: EmployeeOption[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: TransportOrderSchemaValues) => void;
};

const priorityOptions = transportOrderPriorityOptions.map((priority) => ({
  value: priority,
  label: priority,
}));

const defaultValues: TransportOrderSchemaValues = {
  orderNumber: '',
  description: '',
  orderDate: '',
  departureTime: '',
  plannedArrivalTime: '',
  priority: 'MEDIUM',
  notes: '',
  sourceWarehouseId: 0,
  destinationWarehouseId: 0,
  vehicleId: 0,
  assignedEmployeeId: 0,
};

export default function TransportOrderFormDialog({
  open,
  warehouses,
  vehicles,
  employees,
  loading = false,
  onClose,
  onSubmit,
}: TransportOrderFormDialogProps) {
  const form = useForm<TransportOrderSchemaValues>({
    resolver: zodResolver(transportOrderSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(defaultValues);
  }, [form, open]);

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.name} (${warehouse.city})`,
  }));

  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.registrationNumber} — ${vehicle.brand} ${vehicle.model}`,
  }));

  const driverOptions = employees
    .filter((employee) => employee.position === 'DRIVER')
    .map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName} (${employee.email})`,
    }));

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Create transport order</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Fill the confirmed backend fields for transport order creation.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="orderNumber"
                control={form.control}
                label="Order number"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="priority"
                control={form.control}
                label="Priority"
                options={priorityOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextField
                name="description"
                control={form.control}
                label="Description"
                required
                multiline
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormDatePicker
                name="orderDate"
                control={form.control}
                label="Order date"
                inputType="datetime-local"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormDatePicker
                name="departureTime"
                control={form.control}
                label="Departure time"
                inputType="datetime-local"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormDatePicker
                name="plannedArrivalTime"
                control={form.control}
                label="Planned arrival time"
                inputType="datetime-local"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="sourceWarehouseId"
                control={form.control}
                label="Source warehouse"
                options={warehouseOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="destinationWarehouseId"
                control={form.control}
                label="Destination warehouse"
                options={warehouseOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="vehicleId"
                control={form.control}
                label="Vehicle"
                options={vehicleOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="assignedEmployeeId"
                control={form.control}
                label="Driver"
                options={driverOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextField
                name="notes"
                control={form.control}
                label="Notes"
                multiline
                minRows={3}
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
          disabled={loading}
          onClick={form.handleSubmit((values) => onSubmit(values))}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}