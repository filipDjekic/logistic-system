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
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import type {
  EmployeeResponse,
  EmployeeUserOption,
} from '../types/employee.types';
import {
  employeePositionOptions,
  employeeSchema,
  type EmployeeFormValues,
} from '../validation/employeeSchema';

type EmployeeFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: EmployeeResponse | null;
  users: EmployeeUserOption[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
};

const positionOptions = employeePositionOptions.map((position) => ({
  value: position,
  label: position,
}));

const defaultValues: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  jmbg: '',
  phoneNumber: '',
  email: '',
  position: 'MANAGER',
  employmentDate: '',
  salary: '',
  userId: '',
};

export default function EmployeeFormDialog({
  open,
  mode,
  initialData,
  users,
  loading = false,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        jmbg: initialData.jmbg,
        phoneNumber: initialData.phoneNumber,
        email: initialData.email,
        position: initialData.position,
        employmentDate: initialData.employmentDate,
        salary: String(initialData.salary),
        userId: initialData.userId != null ? String(initialData.userId) : '',
      });

      return;
    }

    form.reset(defaultValues);
  }, [form, initialData, mode, open]);

  const userOptions = [
    {
      value: '',
      label: 'No linked user',
    },
    ...users.map((user) => ({
      value: String(user.id),
      label: `${user.firstName} ${user.lastName} (${user.email})`,
    })),
  ];

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create' ? 'Create employee' : 'Edit employee'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="firstName"
                control={form.control}
                label="First name"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="lastName"
                control={form.control}
                label="Last name"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="jmbg"
                control={form.control}
                label="JMBG"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="phoneNumber"
                control={form.control}
                label="Phone number"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="email"
                control={form.control}
                label="Email"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="position"
                control={form.control}
                label="Position"
                options={positionOptions}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormDatePicker
                name="employmentDate"
                control={form.control}
                label="Employment date"
                inputType="date"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="salary"
                control={form.control}
                label="Salary"
                required
                type="number"
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: '0.01',
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelect
                name="userId"
                control={form.control}
                label="Linked user"
                options={userOptions}
                helperText="Optional. Uses confirmed backend userId linking."
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
          onClick={form.handleSubmit(onSubmit)}
        >
          {mode === 'create' ? 'Create employee' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}