import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityDetailsLayout, DetailsField, DetailsOverviewCard, DetailsMetadataCard } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { formatSalary } from '../../../core/utils/formatSalary';
import { invalidateUserState } from '../../../core/utils/invalidateAppState';
import { useRoles } from '../../roles/hooks/useRoles';
import { useCompanies } from '../../companies/hooks/useCompanies';
import UserFormDialog from '../components/UserFormDialog';
import UserStatusChip from '../components/UserStatusChip';
import { usersApi } from '../api/usersApi';
import { useUser } from '../hooks/useUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import type { UpdateUserFormValues } from '../types/user.types';


function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString();
}

export default function UserDetailsPage() {
  const auth = useAuthStore();
  const params = useParams();  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'linkedEmployee' | 'changeHistory'>('overview');

  const userId = Number(params.id);

  const userQuery = useUser(Number.isFinite(userId) ? userId : null);
  const canEdit =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.HR_MANAGER;

  const rolesQuery = useRoles(canEdit);
  const companiesQuery = useCompanies(false);
  const updateUserMutation = useUpdateUser();

  const canToggle = auth.user?.role === ROLES.OVERLORD;

  const enableDisableMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        return usersApi.disable(userId);
      }

      return usersApi.enable(userId);
    },
    onSuccess: async (_, previousEnabled) => {
      showSnackbar({
        message: previousEnabled
          ? 'User disabled successfully.'
          : 'User enabled successfully.',
        severity: 'success',
      });

      await invalidateUserState(queryClient, userId);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });

  if (!Number.isFinite(userId)) {
    return (
      <ErrorState
        title="Invalid user"
        description="The user ID in the route is not valid."
      />
    );
  }

  if (userQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Access control"
        title="User details"
        actionItems={[{ key: 'back', label: 'Back to list', to: '/users' }]}
      >
        <SectionCard>
          <Typography color="text.secondary">Loading user details...</Typography>
        </SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <ErrorState
        title="User could not be loaded"
        description="The requested user details are not available."
        onRetry={() => {
          void userQuery.refetch();
        }}
      />
    );
  }

  const user = userQuery.data;

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'linkedEmployee', label: 'Linked employee' },
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      title={`${user.firstName} ${user.lastName}`}
      breadcrumbs={[{ label: 'Users', to: '/users' }, { label: `${user.firstName} ${user.lastName}` }]}
      hero={{
        overline: 'Access control',
        title: `${user.firstName} ${user.lastName}`,
        subtitle: `User #${user.id}`,
        status: user.status,
        primaryInfo: [
          { label: 'Email', value: user.email },
          { label: 'Role', value: user.roleName },
          { label: 'Company', value: user.company?.name ?? '—' },
        ],
      }}
      actionItems={[
        { key: 'back', label: 'Back to list', to: '/users' },
        ...(canEdit ? [{ key: 'edit', label: 'Edit user', onClick: () => setEditOpen(true) }] : []),
        ...(canToggle ? [{ key: 'toggle', label: user.enabled ? 'Disable user' : 'Enable user', color: user.enabled ? 'warning' as const : 'success' as const, variant: 'contained' as const, disabled: enableDisableMutation.isPending, onClick: () => enableDisableMutation.mutate(user.enabled) }] : []),
      ]}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as 'overview' | 'linkedEmployee' | 'changeHistory')}
    >
      {activeTab === 'overview' ? (
        <DetailsOverviewCard title="User overview" description="User, company and linked employee fields returned by the backend.">
          <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="First name" value={user.firstName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Last name" value={user.lastName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Email" value={user.email} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Role" value={user.roleName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Status" value={<UserStatusChip value={user.status} />} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField
                  label="Enabled"
                  value={<StatusChip value={user.enabled ? 'ACTIVE' : 'INACTIVE'} />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Company" value={user.company?.name ?? '—'} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField
                  label="Company active"
                  value={
                    user.company ? (
                      <StatusChip value={user.company.active ? 'ACTIVE' : 'INACTIVE'} />
                    ) : (
                      '—'
                    )
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Created at" value={formatDateTime(user.createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DetailsField label="Updated at" value={formatDateTime(user.updatedAt)} />
              </Grid>
            </Grid>
          </DetailsOverviewCard>
      ) : null}

      {activeTab === 'linkedEmployee' ? (
        <DetailsMetadataCard
          title="Linked employee"
          description="Employee profile created together with the user."
        >
          <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <DetailsField label="JMBG" value={user.employee?.jmbg ?? '—'} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailsField label="Phone number" value={user.employee?.phoneNumber ?? '—'} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailsField label="Position" value={user.employee?.position ?? '—'} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailsField
                  label="Employment date"
                  value={formatDate(user.employee?.employmentDate)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailsField
                  label="Salary"
                  value={
                    formatSalary(user.employee?.salary, user.employee?.salaryCurrencyCode)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <DetailsField
                  label="Employee active"
                  value={
                    user.employee ? (
                      <StatusChip value={user.employee.active ? 'ACTIVE' : 'INACTIVE'} />
                    ) : (
                      '—'
                    )
                  }
                />
              </Grid>
          </Grid>
        </DetailsMetadataCard>
      ) : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel
          entityName="USER"
          entityId={user.id}
          title="User change history"
          description="Audit trail for account, role and linked employee changes."
        />
      ) : null}

      {canEdit && (
        <UserFormDialog
          open={editOpen}
          mode="edit"
          initialData={user}
          roles={rolesQuery.data ?? []}
          companies={companiesQuery.data ?? []}
          loading={updateUserMutation.isPending}
          onClose={() => setEditOpen(false)}
          onSubmitCreate={() => undefined}
          onSubmitUpdate={(values: UpdateUserFormValues) => {
            updateUserMutation.mutate(
              {
                id: user.id,
                data: {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  roleId: Number(values.roleId),
                  enabled: values.enabled,
                  status: values.status,
                  employee: {
                    jmbg: values.employeeJmbg,
                    phoneNumber: values.employeePhoneNumber,
                    position: values.employeePosition,
                    employmentDate: values.employeeEmploymentDate,
                    salary: Number(values.employeeSalary),
                    active: values.employeeActive,
                  },
                },
              },
              {
                onSuccess: async () => {
                  setEditOpen(false);
                  await invalidateUserState(queryClient, userId);
                },
              },
            );
          }}
        />
      )}
    </EntityDetailsLayout>
  );
}