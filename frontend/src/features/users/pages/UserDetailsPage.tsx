import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useRoles } from '../../roles/hooks/useRoles';
import UserFormDialog from '../components/UserFormDialog';
import UserStatusChip from '../components/UserStatusChip';
import { usersApi } from '../api/usersApi';
import { useUser } from '../hooks/useUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import type { UpdateUserFormValues } from '../types/user.types';

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

export default function UserDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const userId = Number(params.id);

  const userQuery = useUser(Number.isFinite(userId) ? userId : null);
  const rolesQuery = useRoles(true);
  const updateUserMutation = useUpdateUser();

  const [editOpen, setEditOpen] = useState(false);

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

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['users', 'details', userId] });
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });

  const canToggle = useMemo(() => {
    return Boolean(userQuery.data);
  }, [userQuery.data]);

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
      <Stack spacing={3}>
        <PageHeader
          overline="Access control"
          title="User details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/users')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading user details...</Typography>
        </SectionCard>
      </Stack>
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

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Access control"
        title={`${user.firstName} ${user.lastName}`}
        description={`User #${user.id}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/users" variant="outlined">
              Back to list
            </Button>

            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit user
            </Button>

            <Button
              variant="contained"
              color={user.enabled ? 'warning' : 'success'}
              disabled={!canToggle || enableDisableMutation.isPending}
              onClick={() => enableDisableMutation.mutate(user.enabled)}
            >
              {user.enabled ? 'Disable user' : 'Enable user'}
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard
            title="User overview"
            description="Confirmed fields from UserResponse."
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="First name" value={user.firstName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Last name" value={user.lastName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Email" value={user.email} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Role" value={user.roleName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Status" value={<UserStatusChip value={user.status} />} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow
                  label="Enabled"
                  value={<StatusChip value={user.enabled ? 'ACTIVE' : 'INACTIVE'} />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Created at" value={formatDateTime(user.createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Updated at" value={formatDateTime(user.updatedAt)} />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>
      </Grid>

      <UserFormDialog
        open={editOpen}
        mode="edit"
        initialData={user}
        roles={rolesQuery.data ?? []}
        loading={updateUserMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSubmitCreate={() => {}}
        onSubmitUpdate={(values: UpdateUserFormValues) => {
          updateUserMutation.mutate({
            id: user.id,
            data: {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              roleId: Number(values.roleId),
              enabled: values.enabled,
              status: values.status,
            },
          });
          setEditOpen(false);
        }}
      />
    </Stack>
  );
}