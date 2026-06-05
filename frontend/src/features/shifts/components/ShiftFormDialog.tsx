import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import FormActions from '../../../shared/components/Form/FormActions';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import type {
  ShiftEmployeeOption,
  ShiftFormValues,
  ShiftResponse,
} from '../types/shift.types';
import { timezonesApi } from '../../timezones/api/timezonesApi';
import { shiftSchema, type ShiftSchemaValues } from '../validation/shiftSchema';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';

type ShiftFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  employees: ShiftEmployeeOption[];
  initialData?: ShiftResponse | null;
  loading?: boolean;
  serverError?: unknown;
  onClose: () => void;
  onSubmit: (values: ShiftSchemaValues) => void;
};

const emptyValues: ShiftFormValues = {
  startTime: '',
  endTime: '',
  notes: '',
  timezoneId: '',
  employeeId: '',
  warehouseId: '',
};

export default function ShiftFormDialog({
  open,
  mode,
  employees,
  initialData,
  loading = false,
  serverError = null,
  onClose,
  onSubmit,
}: ShiftFormDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<LookupOption | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [timezones, setTimezones] = useState([] as { id: number; name: string; displayName: string }[]);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema) as never,
    defaultValues: emptyValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        startTime: initialData.startTime.slice(0, 16),
        endTime: initialData.endTime.slice(0, 16),
        notes: (initialData.notes ?? '').trim(),
        timezoneId: initialData.timezoneId ?? '',
        employeeId: initialData.employeeId,
        warehouseId: initialData.warehouseId ?? '',
      });

      const employee = employees.find((item) => item.id === initialData.employeeId);

      setSelectedEmployee(
        employee
          ? {
              id: employee.id,
              label: `${employee.firstName} ${employee.lastName} (${employee.email})`,
            }
          : null,
      );

      setSelectedWarehouse(
        initialData.warehouseId
          ? {
              id: Number(initialData.warehouseId),
              label: initialData.warehouseName ?? `Warehouse #${initialData.warehouseId}`,
            }
          : null,
      );

      return;
    }

    form.reset(emptyValues);
    setSelectedEmployee(null);
    setSelectedWarehouse(null);
  }, [employees, form, initialData, mode, open]);

  useEffect(() => {
    if (!open || !serverError) {
      return;
    }

    applyServerFieldErrors(serverError, form.setError);
  }, [form, open, serverError]);

  useEffect(() => {
    if (!open) {
      return;
    }

    timezonesApi.getActive().then(setTimezones).catch(() => setTimezones([]));
  }, [open]);

  const timezoneOptions = useMemo(
    () => timezones.map((timezone) => ({
      value: timezone.id,
      label: `${timezone.displayName} (${timezone.name})`,
    })),
    [timezones],
  );

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Create shift' : 'Edit shift'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormDatePicker
            name="startTime"
            control={form.control}
            label="Start time"
            inputType="datetime-local"
            required
          />

          <FormDatePicker
            name="endTime"
            control={form.control}
            label="End time"
            inputType="datetime-local"
            required
          />

          <EntityLookupField
            label="Employee"
            entityType="employees"
            value={selectedEmployee}
            onChange={(option) => {
              setSelectedEmployee(option);
              form.setValue('employeeId', option?.id ?? '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            required
            error={Boolean(form.formState.errors.employeeId)}
            helperText={form.formState.errors.employeeId?.message}
            placeholder="Choose employee"
            searchPlaceholder="Search employees..."
            sort="lastName,asc"
          />

          <FormSelect
            name="timezoneId"
            control={form.control}
            label="Timezone"
            options={timezoneOptions}
            required
          />

          <EntityLookupField
            label="Warehouse"
            entityType="warehouses"
            value={selectedWarehouse}
            onChange={(option) => {
              setSelectedWarehouse(option);
              form.setValue('warehouseId', option?.id ?? '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            placeholder="Use employee primary warehouse / no warehouse"
            helperText="Required for WORKER and WAREHOUSE_MANAGER shifts. Optional for driver/admin shifts."
            searchPlaceholder="Search warehouses..."
            sort="name,asc"
          />

          <FormTextField
            name="notes"
            control={form.control}
            label="Notes"
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>

      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
          submittingLabel={mode === 'create' ? 'Creating shift...' : 'Saving changes...'}
          helperText="Start time, end time, employee and timezone must be valid before saving."
          loading={loading}
          submitDisabled={!form.formState.isValid}
          onCancel={onClose}
          onSubmit={form.handleSubmit((values) => onSubmit(values as ShiftSchemaValues))}
        />
      </DialogContent>
    </Dialog>
  );
}