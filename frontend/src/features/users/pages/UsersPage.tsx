import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useRoles } from '../../roles/hooks/useRoles';
import UserFormDialog from '../components/UserFormDialog';
import UsersTable from '../components/UsersTable';
import { useCreateUser } from '../hooks/useCreateUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { useUsers } from '../hooks/useUsers';
import type { SortState } from '../../../shared/types/common.types';
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
  UserFiltersState,
  UserResponse,
} from '../types/user.types';
import { userStatusOptions } from '../validation/userSchema';

export default function UsersPage() {
  const auth = useAuthStore();

  const canCreate = auth.user?.role === ROLES.OVERLORD;
  const canEdit =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.HR_MANAGER;

  const [filters, setFilters] = useState<UserFiltersState>({
    search: '',
    status: 'ALL',
    enabled: 'ALL',
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort] = useState<SortState>({ field: 'id', direction: 'desc' });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const usersQuery = useUsers({ page, size, sort: buildSortParam(sort) }, true);
  const rolesQuery = useRoles(canEdit);
  const companiesQuery = useCompanies(canCreate && dialogOpen && dialogMode === 'create');
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (usersQuery.data?.content ?? []).filter((user) => {
      const matchesStatus =
        filters.status === 'ALL' || user.status === filters.status;

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
        (user.company?.name ?? '').toLowerCase().includes(search) ||
        (user.employee?.position ?? '').toLowerCase().includes(search) ||
        (user.employee?.jmbg ?? '').includes(search);

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
          canCreate
            ? 'Create, review and update user accounts together with their linked employee profiles.'
            : canEdit
              ? 'Review and update user accounts. User creation remains restricted to OVERLORD.'
              : 'Review user accounts.'
        }
        actions={
          canCreate ? (
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
          ) : undefined
        }
      />

      <TableLayout
        title="User list"
        description="Each business user should be created together with the linked employee profile."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by name, email, role, company, employee position, JMBG or ID"
            onRefresh={() => {
              void usersQuery.refetch();
              if (canEdit) void rolesQuery.refetch();
              if (canCreate && dialogOpen && dialogMode === 'create') void companiesQuery.refetch();
            }}
            refreshDisabled={usersQuery.isFetching || rolesQuery.isFetching || companiesQuery.isFetching}
          />
        }
        filters={
          <FilterPanel minColumnWidth={180}>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as UserFiltersState['status'] }))}
            >
              <MenuItem value="ALL">All</MenuItem>
              {userStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Enabled"
              value={filters.enabled}
              onChange={(event) => setFilters((prev) => ({ ...prev, enabled: event.target.value as UserFiltersState['enabled'] }))}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ENABLED">Enabled</MenuItem>
              <MenuItem value="DISABLED">Disabled</MenuItem>
            </TextField>
          </FilterPanel>
        }
        table={
          <>
            <UsersTable
              rows={filteredRows}
              loading={usersQuery.isLoading}
              error={usersQuery.isError}
              onRetry={() => { void usersQuery.refetch(); }}
              onEdit={(user) => {
                if (!canEdit) return;
                setDialogMode('edit');
                setSelectedUser(user);
                setDialogOpen(true);
              }}
              showDetails
              showEdit={canEdit}
            />
            <ServerTablePagination
              page={usersQuery.data}
              disabled={usersQuery.isFetching}
              onPageChange={setPage}
              onSizeChange={(nextSize) => { setPage(0); setSize(nextSize); }}
            />
          </>
        }
      />

      {(canCreate || canEdit) && (
        <UserFormDialog
          open={dialogOpen}
          mode={dialogMode}
          initialData={selectedUser}
          roles={rolesQuery.data ?? []}
          companies={companiesQuery.data ?? []}
          loading={isSaving}
          createError={createUserMutation.error}
          updateError={updateUserMutation.error}
          onClose={() => setDialogOpen(false)}
          onSubmitCreate={(values: CreateUserFormValues) => {
            createUserMutation.mutate({
              password: values.password,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
              email: values.email.trim(),
              roleId: Number(values.roleId),
              status: values.status,
              companyId: Number(values.companyId),
              employee: {
                jmbg: values.employeeJmbg.trim(),
                phoneNumber: values.employeePhoneNumber.trim(),
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
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.trim(),
                roleId: Number(values.roleId),
                enabled: values.enabled,
                status: values.status,
                employee: {
                  jmbg: values.employeeJmbg.trim(),
                  phoneNumber: values.employeePhoneNumber.trim(),
                  position: values.employeePosition,
                  employmentDate: values.employeeEmploymentDate,
                  salary: Number(values.employeeSalary),
                  active: values.employeeActive,
                },
              },
            });
          }}
        />
      )}
    </Stack>
  );
}