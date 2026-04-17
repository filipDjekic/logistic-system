import { useEffect, useMemo } from 'react';
import {
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
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useForm } from 'react-hook-form';
import Form from '../../../shared/components/Form/Form';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { RoleResponse } from '../../roles/types/role.types';
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
  UserResponse,
} from '../types/user.types';
import {
  createUserSchema,
  employeePositionOptions,
  updateUserSchema,
  userStatusOptions,
} from '../validation/userSchema';

type UserFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: UserResponse | null;
  roles: RoleResponse[];
  loading?: boolean;
  onClose: () => void;
  onSubmitCreate: (values: CreateUserFormValues) => void;
  onSubmitUpdate: (values: UpdateUserFormValues) => void;
};

const statusOptions = userStatusOptions.map((status) => ({
  value: status,
  label: status,
}));

const positionOptions = employeePositionOptions.map((position) => ({
  value: position,
  label: position,
}));

const createDefaultValues: CreateUserFormValues = {
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  roleId: '',
  status: 'ACTIVE',
  employeeJmbg: '',
  employeePhoneNumber: '',
  employeePosition: 'WORKER',
  employeeEmploymentDate: '',
  employeeSalary: '',
};

const updateDefaultValues: UpdateUserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  roleId: '',
  enabled: true,
  status: 'ACTIVE',
  employeeJmbg: '',
  employeePhoneNumber: '',
  employeePosition: 'WORKER',
  employeeEmploymentDate: '',
  employeeSalary: '',
  employeeActive: true,
};

export default function UserFormDialog({
  open,
  mode,
  initialData,
  roles,
  loading = false,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: UserFormDialogProps) {
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: createDefaultValues,
  });

  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: updateDefaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'create') {
      createForm.reset(createDefaultValues);
      return;
    }

    if (initialData) {
      updateForm.reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        roleId: String(initialData.roleId),
        enabled: initialData.enabled,
        status: initialData.status,
        employeeJmbg: initialData.employee?.jmbg ?? '',
        employeePhoneNumber: initialData.employee?.phoneNumber ?? '',
        employeePosition: initialData.employee?.position ?? 'WORKER',
        employeeEmploymentDate: initialData.employee?.employmentDate ?? '',
        employeeSalary:
          initialData.employee?.salary != null
            ? String(initialData.employee.salary)
            : '',
        employeeActive: initialData.employee?.active ?? true,
      });
      return;
    }

    updateForm.reset(updateDefaultValues);
  }, [open, mode, initialData, createForm, updateForm]);

  const auth = useAuthStore();

  const visibleRoles = useMemo(
    () =>
      roles.filter((role) => {
        if (auth.user?.role === ROLES.OVERLORD) {
          return true;
        }

        if (auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.HR_MANAGER) {
          return role.name !== ROLES.OVERLORD && role.name !== ROLES.COMPANY_ADMIN;
        }

        return false;
      }),
    [auth.user?.role, roles],
  );

  const roleOptions = visibleRoles.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  const isCreate = mode === 'create';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{isCreate ? 'Create user' : 'Edit user'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              User data
            </Typography>

            {isCreate ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="password"
                    control={createForm.control}
                    label="Password"
                    type="password"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="firstName"
                    control={createForm.control}
                    label="First name"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="lastName"
                    control={createForm.control}
                    label="Last name"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="email"
                    control={createForm.control}
                    label="Email"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="roleId"
                    control={createForm.control}
                    label="Role"
                    options={roleOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="status"
                    control={createForm.control}
                    label="Status"
                    options={statusOptions}
                    required
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="firstName"
                    control={updateForm.control}
                    label="First name"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="lastName"
                    control={updateForm.control}
                    label="Last name"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="email"
                    control={updateForm.control}
                    label="Email"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="roleId"
                    control={updateForm.control}
                    label="Role"
                    options={roleOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="status"
                    control={updateForm.control}
                    label="Status"
                    options={statusOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <FormCheckbox
                    name="enabled"
                    control={updateForm.control}
                    label="Enabled"
                  />
                </Grid>
              </Grid>
            )}
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Linked employee data
            </Typography>

            {isCreate ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="employeeJmbg"
                    control={createForm.control}
                    label="JMBG"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="employeePhoneNumber"
                    control={createForm.control}
                    label="Phone number"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="employeePosition"
                    control={createForm.control}
                    label="Employee position"
                    options={positionOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormDatePicker
                    name="employeeEmploymentDate"
                    control={createForm.control}
                    label="Employment date"
                    inputType="date"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="employeeSalary"
                    control={createForm.control}
                    label="Salary"
                    type="number"
                    required
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="employeeJmbg"
                    control={updateForm.control}
                    label="JMBG"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="employeePhoneNumber"
                    control={updateForm.control}
                    label="Phone number"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="employeePosition"
                    control={updateForm.control}
                    label="Employee position"
                    options={positionOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormDatePicker
                    name="employeeEmploymentDate"
                    control={updateForm.control}
                    label="Employment date"
                    inputType="date"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Form
                    name="employeeSalary"
                    control={updateForm.control}
                    label="Salary"
                    type="number"
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <FormCheckbox
                    name="employeeActive"
                    control={updateForm.control}
                    label="Employee active"
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        {isCreate ? (
          <Button
            variant="contained"
            disabled={loading}
            onClick={createForm.handleSubmit(onSubmitCreate)}
          >
            Create user
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={loading}
            onClick={updateForm.handleSubmit(onSubmitUpdate)}
          >
            Save changes
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}