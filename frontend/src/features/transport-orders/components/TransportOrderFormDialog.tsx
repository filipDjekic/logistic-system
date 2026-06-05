import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import FormActions from '../../../shared/components/Form/FormActions';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import { EntityLookupField } from '../../lookup';
import FormTextField from '../../../shared/components/Form/Form';
import BusinessRuleWarnings, { type BusinessRuleWarning } from '../../../shared/components/BusinessRuleWarnings';
import type {
  EmployeeOption,
  TransportOrderResponse,
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
  initialData?: TransportOrderResponse | null;
  loading?: boolean;
  serverError?: unknown;
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

function toInputDateTime(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TransportOrderFormDialog({
  open,
  warehouses,
  vehicles,
  employees,
  initialData = null,
  loading = false,
  serverError = null,
  onClose,
  onSubmit,
}: TransportOrderFormDialogProps) {
  const form = useForm<TransportOrderSchemaValues>({
    resolver: zodResolver(transportOrderSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialData) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      orderNumber: initialData.orderNumber,
      description: initialData.description,
      orderDate: toInputDateTime(initialData.orderDate),
      departureTime: toInputDateTime(initialData.departureTime),
      plannedArrivalTime: toInputDateTime(initialData.plannedArrivalTime),
      priority: initialData.priority,
      notes: initialData.notes ?? '',
      sourceWarehouseId: initialData.sourceWarehouseId,
      destinationWarehouseId: initialData.destinationWarehouseId,
      vehicleId: initialData.vehicleId,
      assignedEmployeeId: initialData.assignedEmployeeId,
    });
  }, [form, initialData, open]);

  useEffect(() => {
    if (!open || !serverError) {
      return;
    }

    applyServerFieldErrors(serverError, form.setError);
  }, [form, open, serverError]);

  const sourceWarehouseId = useWatch({ control: form.control, name: 'sourceWarehouseId' });
  const destinationWarehouseId = useWatch({ control: form.control, name: 'destinationWarehouseId' });
  const vehicleId = useWatch({ control: form.control, name: 'vehicleId' });
  const assignedEmployeeId = useWatch({ control: form.control, name: 'assignedEmployeeId' });

  const selectedSourceWarehouse = warehouses.find((warehouse) => warehouse.id === Number(sourceWarehouseId));
  const selectedDestinationWarehouse = warehouses.find((warehouse) => warehouse.id === Number(destinationWarehouseId));
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === Number(vehicleId));
  const selectedDriver = employees.find((employee) => employee.id === Number(assignedEmployeeId));

  const isEditMode = initialData !== null;
  const businessWarnings: BusinessRuleWarning[] = [];

  if (selectedSourceWarehouse && selectedSourceWarehouse.status !== 'ACTIVE') {
    businessWarnings.push({
      key: 'source-warehouse-status',
      severity: 'error',
      message: `Source warehouse is ${selectedSourceWarehouse.status}. Transport orders should start only from active warehouses.`,
    });
  }

  if (selectedDestinationWarehouse && selectedDestinationWarehouse.status !== 'ACTIVE') {
    businessWarnings.push({
      key: 'destination-warehouse-status',
      severity: selectedDestinationWarehouse.status === 'FULL' ? 'warning' : 'error',
      message: `Destination warehouse is ${selectedDestinationWarehouse.status}. Check capacity and operational availability before creating the order.`,
    });
  }

  if (selectedVehicle && selectedVehicle.status !== 'AVAILABLE') {
    businessWarnings.push({
      key: 'vehicle-status',
      severity: 'error',
      message: `Selected vehicle is ${selectedVehicle.status}. Use an available vehicle or update vehicle status first.`,
    });
  }

  if (selectedDriver && selectedDriver.position !== 'DRIVER') {
    businessWarnings.push({
      key: 'driver-role',
      severity: 'warning',
      message: `Selected employee has ${selectedDriver.position} position. Driver assignment should normally use an employee with DRIVER position.`,
    });
  }

  if (sourceWarehouseId && destinationWarehouseId && Number(sourceWarehouseId) === Number(destinationWarehouseId)) {
    businessWarnings.push({
      key: 'same-warehouse',
      severity: 'error',
      message: 'Source and destination warehouse must be different for a transport order.',
    });
  }

  const blockingWarning = businessWarnings.some((warning) => warning.severity === 'error');
  const disableSubmit = loading || !form.formState.isValid || blockingWarning;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditMode ? 'Update transport order' : 'Create transport order'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isEditMode
              ? 'Update only planning fields before the order starts.'
              : 'Create the transport order, assign route, vehicle and driver in one flow.'}
          </Typography>

          <Typography variant="subtitle2" fontWeight={700}>
            Basic info
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="orderNumber" control={form.control} label="Order number" required />
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
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Schedule
          </Typography>

          <Grid container spacing={2}>
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
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Route and assignment
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="sourceWarehouseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Source warehouse"
                    entityType="warehouses"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedSourceWarehouse?.name ?? `Warehouse #${field.value}`,
                      subtitle: selectedSourceWarehouse?.city ?? undefined,
                      status: selectedSourceWarehouse?.status ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search warehouses..."
                    disabledOptionIds={destinationWarehouseId ? [Number(destinationWarehouseId)] : []}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="destinationWarehouseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Destination warehouse"
                    entityType="warehouses"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedDestinationWarehouse?.name ?? `Warehouse #${field.value}`,
                      subtitle: selectedDestinationWarehouse?.city ?? undefined,
                      status: selectedDestinationWarehouse?.status ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search warehouses..."
                    disabledOptionIds={sourceWarehouseId ? [Number(sourceWarehouseId)] : []}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="vehicleId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Vehicle"
                    entityType="vehicles"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedVehicle?.registrationNumber ?? `Vehicle #${field.value}`,
                      subtitle: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : undefined,
                      status: selectedVehicle?.status ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search vehicles..."
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="assignedEmployeeId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Driver"
                    entityType="employees"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : `Employee #${field.value}`,
                      subtitle: selectedDriver?.email ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search drivers..."
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider />

          <BusinessRuleWarnings warnings={businessWarnings} />

          <Typography variant="subtitle2" fontWeight={700}>
            Notes
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormTextField name="notes" control={form.control} label="Notes" multiline minRows={3} />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogContent sx={{ pt: 2 }}>
        <FormGlobalError error={serverError} />

        <FormActions
          submitLabel={isEditMode ? 'Update' : 'Create'}
          submittingLabel={isEditMode ? 'Updating order...' : 'Creating order...'}
          helperText="Warehouses, vehicle, driver and schedule fields must be valid before saving."
          loading={loading}
          submitDisabled={disableSubmit && !loading}
          onCancel={onClose}
          onSubmit={form.handleSubmit((values) => onSubmit({
            ...values,
            orderNumber: values.orderNumber.trim(),
            description: values.description.trim(),
            notes: values.notes?.trim() || '',
          }))}
        />
      </DialogContent>
    </Dialog>
  );
}
