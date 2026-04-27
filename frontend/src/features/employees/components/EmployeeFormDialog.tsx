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
import { useForm, useWatch } from 'react-hook-form';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import type { CompanyResponse } from '../../companies/types/company.types';
import type {
  EmployeeResponse,
  EmployeeRoleOption,
  EmployeeUserOption,
} from '../types/employee.types';
import {
  getEmployeeFormSchema,
  type EmployeeFormValues,
  userStatusOptions,
} from '../validation/employeeSchema';

type EmployeeFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: EmployeeResponse | null;
  linkedUser?: EmployeeUserOption | null;
  roles: EmployeeRoleOption[];
  companies: CompanyResponse[];
  companyName?: string | null;
  isOverlord?: boolean;
  loading?: boolean;
  canEdit?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
};

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
  password: '',
  status: 'ACTIVE',
  enabled: true,
  companyId: '',
};

function normalizeForEmail(value: string, allowHyphen: boolean) {
  let normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  normalized = allowHyphen
    ? normalized.replace(/[^a-z0-9]+/g, '-')
    : normalized.replace(/[^a-z0-9]+/g, '.');

  normalized = normalized
    .replace(/[-.]{2,}/g, allowHyphen ? '-' : '.')
    .replace(/^[-.]+|[-.]+$/g, '');

  return normalized;
}

function buildEmail(firstName: string, lastName: string, companyName?: string | null, position?: string) {
  const localPart = [
    normalizeForEmail(firstName, false),
    normalizeForEmail(lastName, false),
  ]
    .filter(Boolean)
    .join('.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  const companyPart = normalizeForEmail(companyName ?? 'company', true) || 'company';
  const positionPart = normalizeForEmail(position ?? 'worker', true) || 'worker';

  if (!localPart) {
    return '';
  }

  return `${localPart}@${companyPart}.${positionPart}.rs`;
}

export default function EmployeeFormDialog({
  open,
  mode,
  initialData,
  linkedUser = null,
  roles,
  companies,
  companyName = null,
  isOverlord = false,
  loading = false,
  canEdit = true,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const hasLinkedUser = mode === 'edit' && Boolean(linkedUser);
  const requireCompany = mode === 'create' && isOverlord;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(getEmployeeFormSchema(mode, hasLinkedUser, requireCompany)),
    defaultValues,
    mode: 'onChange',
  });

  const firstName = useWatch({ control: form.control, name: 'firstName' });
  const lastName = useWatch({ control: form.control, name: 'lastName' });
  const selectedPosition = useWatch({ control: form.control, name: 'position' });
  const selectedCompanyId = useWatch({ control: form.control, name: 'companyId' });

  const positionOptions = useMemo(
    () =>
      roles.map((role) => ({
        value: role.name,
        label: role.name,
      })),
    [roles],
  );

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        value: String(company.id),
        label: company.name,
      })),
    [companies],
  );

  const selectedCompanyName = useMemo(() => {
    if (mode !== 'create') {
      return companyName;
    }

    if (!isOverlord) {
      return companyName;
    }

    const selectedCompany = companies.find(
      (company) => String(company.id) === String(selectedCompanyId),
    );

    return selectedCompany?.name ?? null;
  }, [companies, companyName, isOverlord, mode, selectedCompanyId]);

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
        password: '',
        status: linkedUser?.status ?? 'ACTIVE',
        enabled: linkedUser?.enabled ?? true,
        companyId: initialData.companyId != null ? String(initialData.companyId) : '',
      });
      return;
    }

    form.reset(defaultValues);
  }, [form, initialData, linkedUser, mode, open]);

  useEffect(() => {
    if (mode !== 'create') {
      return;
    }

    const nextEmail = buildEmail(firstName ?? '', lastName ?? '', selectedCompanyName, selectedPosition);
    form.setValue('email', nextEmail, { shouldDirty: true, shouldValidate: true });
  }, [firstName, form, lastName, mode, selectedCompanyName, selectedPosition]);

  const disableSubmit = loading || !form.formState.isValid || (mode === 'edit' && !canEdit);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === 'create' ? 'Create employee' : 'Edit employee'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Create or update the employee profile and linked user account data.
          </Typography>

          <Typography variant="subtitle2" fontWeight={700}>
            Personal info
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="firstName" control={form.control} label="First name" required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="lastName" control={form.control} label="Last name" required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="jmbg" control={form.control} label="JMBG" required />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="phoneNumber" control={form.control} label="Phone number" required />
            </Grid>

          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Employment
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="position"
                control={form.control}
                label="Role"
                options={positionOptions}
                required
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormDatePicker
                name="employmentDate"
                control={form.control}
                label="Employment date"
                inputType="date"
                required
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="salary"
                control={form.control}
                label="Salary"
                type="number"
                required
                disabled={mode === 'edit' && !canEdit}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: '0.01',
                  },
                }}
              />
            </Grid>

          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            User account
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="email"
                control={form.control}
                label="Email"
                required
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
            </Grid>

            {mode === 'create' && isOverlord ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormSelect
                  name="companyId"
                  control={form.control}
                  label="Company"
                  options={companyOptions}
                  required
                />
              </Grid>
            ) : null}

            {mode === 'create' ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField
                  name="password"
                  control={form.control}
                  label="Password"
                  type="password"
                  required
                />
              </Grid>
            ) : null}

            {hasLinkedUser && canEdit ? (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormSelect
                    name="status"
                    control={form.control}
                    label="Account status"
                    options={userStatusSelectOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormCheckbox name="enabled" control={form.control} label="Account enabled" />
                </Grid>
              </>
            ) : null}
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" disabled={disableSubmit} onClick={form.handleSubmit(onSubmit)}>
          {mode === 'create' ? 'Create employee' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}