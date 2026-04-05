import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import type {
  ShiftEmployeeOption,
  ShiftFormValues,
  ShiftResponse,
} from '../types/shift.types';
import { shiftSchema, shiftStatusOptions, type ShiftSchemaValues } from '../validation/shiftSchema';

type ShiftFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  employees: ShiftEmployeeOption[];
  initialData?: ShiftResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: ShiftSchemaValues) => void;
};

const statusOptions = shiftStatusOptions.map((status) => ({
  value: status,
  label: status,
}));

export default function ShiftFormDialog({
  open,
  mode,
  employees,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: ShiftFormDialogProps) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      startTime: '',
      endTime: '',
      status: 'PLANNED',
      notes: '',
      employeeId: '',
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        startTime: initialData.startTime.slice(0, 16),
        endTime: initialData.endTime.slice(0, 16),
        status: initialData.status,
        notes: initialData.notes ?? '',
        employeeId: initialData.employeeId,
      });

      return;
    }

    form.reset({
      startTime: '',
      endTime: '',
      status: 'PLANNED',
      notes: '',
      employeeId: '',
    });
  }, [form, initialData, mode, open]);

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: `${employee.firstName} ${employee.lastName} (${employee.email})`,
  }));

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

          <FormSelect
            name="status"
            control={form.control}
            label="Status"
            options={statusOptions}
            required
            disabled={mode === 'create'}
          />

          {mode === 'create' ? (
            <FormSelect
              name="employeeId"
              control={form.control}
              label="Employee"
              options={employeeOptions}
              required
            />
          ) : null}

          <FormTextField
            name="notes"
            control={form.control}
            label="Notes"
            multiline
            minRows={3}
          />
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