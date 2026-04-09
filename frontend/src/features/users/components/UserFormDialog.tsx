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
import Form from '../../../shared/components/Form/Form';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { RoleResponse } from '../../roles/types/role.types';
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
  UserResponse,
} from '../types/user.types';
import {
  createUserSchema,
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

const createDefaultValues: CreateUserFormValues = {
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  roleId: '',
  status: 'ACTIVE',
};

const updateDefaultValues: UpdateUserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  roleId: '',
  enabled: true,
  status: 'ACTIVE',
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
      });
      return;
    }

    updateForm.reset(updateDefaultValues);
  }, [open, mode, initialData, createForm, updateForm]);

  const roleOptions = roles.map((role) => ({
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
        <Stack spacing={2} sx={{ pt: 1 }}>
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

              <Grid size={{ xs: 12, md: 6 }}>
                <FormCheckbox
                  name="enabled"
                  control={updateForm.control}
                  label="Enabled"
                />
              </Grid>
            </Grid>
          )}
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