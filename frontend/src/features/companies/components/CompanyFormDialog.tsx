import { useEffect, useMemo } from 'react';
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
import { useForm, useWatch } from 'react-hook-form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormTextField from '../../../shared/components/Form/Form';
import type { CompanyResponse } from '../types/company.types';
import {
  buildBootstrapAdminPreview,
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
  adminPassword: '',
  adminJmbg: '',
  adminPhoneNumber: '',
  adminEmploymentDate: '',
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

  const companyName = useWatch({ control: form.control, name: 'name' });
  const adminFirstName = useWatch({ control: form.control, name: 'adminFirstName' });
  const adminLastName = useWatch({ control: form.control, name: 'adminLastName' });

  const preview = useMemo(
    () => buildBootstrapAdminPreview(companyName ?? '', adminFirstName ?? '', adminLastName ?? ''),
    [adminFirstName, adminLastName, companyName],
  );

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create company' : 'Edit company'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {mode === 'create' ? (
            <Alert severity="info">
              Creating a company automatically creates the initial COMPANY_ADMIN user and linked employee profile.
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
                      name="adminPassword"
                      control={form.control}
                      label="Password"
                      type="password"
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
                    <FormDatePicker
                      name="adminEmploymentDate"
                      control={form.control}
                      label="Employment date"
                      inputType="date"
                      required
                    />
                  </Grid>
                </Grid>

                <Alert severity="success" variant="outlined">
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Assigned role:</strong> {preview.role}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assigned user status:</strong> {preview.status}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assigned employee position:</strong> {preview.position}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Generated username:</strong> {preview.username}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Generated email:</strong> {preview.email}
                    </Typography>
                  </Stack>
                </Alert>
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
