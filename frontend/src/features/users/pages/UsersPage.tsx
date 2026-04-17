import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useRoles } from '../../roles/hooks/useRoles';
import UserFormDialog from '../components/UserFormDialog';
import UsersTable from '../components/UsersTable';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { useUsers } from '../hooks/useUsers';
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
  UserFiltersState,
  UserResponse,
} from '../types/user.types';
import { userStatusOptions } from '../validation/userSchema';

export default function UsersPage() {
  const auth = useAuthStore();
  const canManage =
    auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.OVERLORD;

  const [filters, setFilters] = useState<UserFiltersState>({
    search: '',
    status: 'ALL',
    enabled: 'ALL',
  });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const usersQuery = useUsers(true);
  const rolesQuery = useRoles(canManage);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (usersQuery.data ?? []).filter((user) => {
      const matchesStatus = filters.status === 'ALL' || user.status === filters.status;

      const matchesEnabled =
        filters.enabled === 'ALL' ||
        (filters.enabled === 'ENABLED' && user.enabled) ||
        (filters.enabled === 'DISABLED' && !user.enabled);

      const matchesSearch =
        search.length === 0 ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.roleName.toLowerCase().includes(search) ||
        user.status.toLowerCase().includes(search) ||
        String(user.id).includes(search) ||
        user.company?.name.toLowerCase().includes(search) ||
        user.employee?.position.toLowerCase().includes(search) ||
        user.employee?.jmbg.includes(search);

      return matchesStatus && matchesEnabled && matchesSearch;
    });
  }, [filters, usersQuery.data]);

  const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Access control"
        title="Users"
        description={
          canManage
            ? 'Manage user accounts together with their linked employee profiles.'
            : 'Review user accounts. Access is limited by the current backend authorization rules.'
        }
        actions={
          canManage ? (
            <Button
              variant="contained"
              onClick={() => {
                setDialogMode('create');
                setSelectedUser(null);
                setDialogOpen(true);
              }}
            >
              Create user
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="User list"
        description="Each business user should be created together with the linked employee profile."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by name, email, role, company, employee position, JMBG or ID"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as UserFiltersState['status'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {userStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Enabled"
              value={filters.enabled}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  enabled: event.target.value as UserFiltersState['enabled'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ENABLED">Enabled</MenuItem>
              <MenuItem value="DISABLED">Disabled</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void usersQuery.refetch();
                if (isAdmin) {
                  void rolesQuery.refetch();
                }
              }}
              disabled={usersQuery.isFetching || rolesQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <UsersTable
            rows={filteredRows}
            loading={usersQuery.isLoading}
            error={usersQuery.isError}
            onRetry={() => {
              void usersQuery.refetch();
            }}
            onEdit={(user: UserResponse) => {
              setDialogMode('edit');
              setSelectedUser(user);
              setDialogOpen(true);
            }}
            showAdminActions={isAdmin}
          />
        </Stack>
      </SectionCard>

      {isAdmin ? (
        <UserFormDialog
          open={dialogOpen}
          mode={dialogMode}
          initialData={selectedUser}
          roles={rolesQuery.data ?? []}
          loading={isSaving}
          onClose={() => setDialogOpen(false)}
          onSubmitCreate={(values: CreateUserFormValues) => {
            createUserMutation.mutate({
              password: values.password,
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              roleId: Number(values.roleId),
              status: values.status,
              employee: {
                jmbg: values.employeeJmbg,
                phoneNumber: values.employeePhoneNumber,
                position: values.employeePosition,
                employmentDate: values.employeeEmploymentDate,
                salary: Number(values.employeeSalary),
              },
            });
          }}
          onSubmitUpdate={(values: UpdateUserFormValues) => {
            if (!selectedUser) {
              return;
            }

            updateUserMutation.mutate({
              id: selectedUser.id,
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
            });
          }}
        />
      ) : null}
    </Stack>
  );
}