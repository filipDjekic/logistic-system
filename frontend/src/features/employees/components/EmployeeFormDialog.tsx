import { useEffect } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  EmployeeResponse,
  EmployeeRoleOption,
  EmployeeUserOption,
} from '../types/employee.types';
import {
  employeePositionOptions,
  getEmployeeFormSchema,
  type EmployeeFormValues,
  userStatusOptions,
} from '../validation/employeeSchema';

type EmployeeFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: EmployeeResponse | null;
  users: EmployeeUserOption[];
  roles: EmployeeRoleOption[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
};

const positionOptions = employeePositionOptions.map((position) => ({
  value: position,
  label: position,
}));

const userStatusSelectOptions = userStatusOptions.map((status) => ({
  value: status,
  label: status,
}));

const defaultValues: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  jmbg: '',
  phoneNumber: '',
  email: '',
  position: 'WORKER',
  employmentDate: '',
  salary: '',
  userId: '',
  password: '',
  roleId: '',
  status: 'ACTIVE',
};

export default function EmployeeFormDialog({
  open,
  mode,
  initialData,
  users,
  roles,
  loading = false,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(getEmployeeFormSchema(mode)),
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
        password: '',
        roleId: '',
        status: 'ACTIVE',
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

  const roleOptions = roles.map((role) => ({
    value: String(role.id),
    label: role.description?.trim()
      ? `${role.name} — ${role.description}`
      : role.name,
  }));

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create' ? 'Create employee and user' : 'Edit employee'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {mode === 'create' ? (
            <Alert severity="info">
              This flow creates the employee and linked user account in one request.
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Employee data
            </Typography>

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

              {mode === 'edit' ? (
                <Grid size={{ xs: 12 }}>
                  <FormSelect
                    name="userId"
                    control={form.control}
                    label="Linked user"
                    options={userOptions}
                    helperText="Optional user linking is preserved for edit mode."
                  />
                </Grid>
              ) : null}
            </Grid>
          </Stack>

          {mode === 'create' ? (
            <>
              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  User account
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="password"
                      control={form.control}
                      label="Password"
                      required
                      type="password"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormSelect
                      name="roleId"
                      control={form.control}
                      label="Role"
                      options={roleOptions}
                      required
                      helperText="Roles are loaded from the backend role list."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormSelect
                      name="status"
                      control={form.control}
                      label="User status"
                      options={userStatusSelectOptions}
                      required
                    />
                  </Grid>
                </Grid>
              </Stack>
            </>
          ) : null}
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
          {mode === 'create' ? 'Create employee and user' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}