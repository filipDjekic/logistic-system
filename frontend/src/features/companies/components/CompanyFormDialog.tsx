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
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormTextField from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { CompanyResponse } from '../types/company.types';
import {
  companyAdminPositionOptions,
  companyAdminStatusOptions,
  companySchema,
  type CompanySchemaValues,
} from '../validation/companySchema';

type CompanyFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: CompanyResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CompanySchemaValues) => void;
};

const defaultValues: CompanySchemaValues = {
  name: '',
  active: true,
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
  adminStatus: 'ACTIVE',
  adminJmbg: '',
  adminPhoneNumber: '',
  adminPosition: 'MANAGER',
  adminEmploymentDate: '',
  adminSalary: '',
};

export default function CompanyFormDialog({
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: CompanyFormDialogProps) {
  const form = useForm<CompanySchemaValues>({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        ...defaultValues,
        name: initialData.name,
        active: initialData.active,
      });
      return;
    }

    form.reset(defaultValues);
  }, [form, initialData, mode, open]);

  const positionOptions = companyAdminPositionOptions.map((value) => ({
    value,
    label: value,
  }));

  const statusOptions = companyAdminStatusOptions.map((value) => ({
    value,
    label: value,
  }));

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create company' : 'Edit company'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {mode === 'create' ? (
            <Alert severity="info">
              Creating a company also creates the initial COMPANY_ADMIN user and linked
              employee profile.
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Company data
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormTextField
                  name="name"
                  control={form.control}
                  label="Company name"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormCheckbox
                  name="active"
                  control={form.control}
                  label="Company is active"
                />
              </Grid>
            </Grid>
          </Stack>

          {mode === 'create' ? (
            <>
              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Initial company admin
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminFirstName"
                      control={form.control}
                      label="First name"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminLastName"
                      control={form.control}
                      label="Last name"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminEmail"
                      control={form.control}
                      label="Email"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminPassword"
                      control={form.control}
                      label="Password"
                      type="password"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormSelect
                      name="adminStatus"
                      control={form.control}
                      label="User status"
                      options={statusOptions}
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminJmbg"
                      control={form.control}
                      label="JMBG"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminPhoneNumber"
                      control={form.control}
                      label="Phone number"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormSelect
                      name="adminPosition"
                      control={form.control}
                      label="Employee position"
                      options={positionOptions}
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormDatePicker
                      name="adminEmploymentDate"
                      control={form.control}
                      label="Employment date"
                      inputType="date"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormTextField
                      name="adminSalary"
                      control={form.control}
                      label="Salary"
                      type="number"
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
          onClick={form.handleSubmit((values) => onSubmit(values))}
          disabled={loading}
        >
          {mode === 'create' ? 'Create company' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}