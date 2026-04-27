import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useCompanies } from '../../companies/hooks/useCompanies';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { useUpdateUser } from '../../users/hooks/useUpdateUser';
import EmployeeFormDialog from '../components/EmployeeFormDialog';
import EmployeesTable from '../components/EmployeesTable';
import { employeesApi } from '../api/employeesApi';
import { useCreateEmployee } from '../hooks/useCreateEmployee';
import { useEmployees } from '../hooks/useEmployees';
import { useUpdateEmployee } from '../hooks/useUpdateEmployee';
import type { SortState } from '../../../shared/types/common.types';
import type {
  EmployeeFiltersState,
  EmployeeResponse,
  EmployeeRoleOption,
  EmployeeUserOption,
} from '../types/employee.types';
import { employeePositionOptions, type EmployeeFormValues } from '../validation/employeeSchema';

export default function EmployeesPage() {
  const auth = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;

  const canEditEmployees = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.HR_MANAGER;
  const canCreateEmployees =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.HR_MANAGER ||
    auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<EmployeeFiltersState>({
    search: '',
    position: 'ALL',
    active: 'ALL',
    linkedUser: 'ALL',
  });


  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'lastName', direction: 'asc' });

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const employeeListFilters = useMemo(
    () => ({
      search: filters.search,
      position: filters.position === 'ALL' ? undefined : filters.position,
      active:
        filters.active === 'ALL'
          ? undefined
          : filters.active === 'ACTIVE',
      linkedUser: filters.linkedUser === 'ALL' ? undefined : filters.linkedUser,
    }),
    [filters],
  );

  const employeesQuery = useEmployees({ ...employeeListFilters, page, size, sort: buildSortParam(sort) }, true);

  const usersQuery = useQuery({
    queryKey: ['users', 'all'],
    queryFn: employeesApi.getUsers,
    enabled: canEditEmployees,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const rolesQuery = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: employeesApi.getRoles,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const companiesQuery = useCompanies(
    canCreateEmployees && isOverlord && dialogOpen && dialogMode === 'create',
  );

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const updateUserMutation = useUpdateUser();

  const users = useMemo<EmployeeUserOption[]>(() => usersQuery.data ?? [], [usersQuery.data]);
  const roles = useMemo<EmployeeRoleOption[]>(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const usersById = useMemo<Record<number, EmployeeUserOption>>(
    () =>
      users.reduce<Record<number, EmployeeUserOption>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}),
    [users],
  );

  const selectedLinkedUser = useMemo(() => {
    if (!selectedEmployee || !selectedEmployee.userId) {
      return null;
    }

    return usersById[selectedEmployee.userId] ?? null;
  }, [selectedEmployee, usersById]);

  const isSaving =
    createEmployeeMutation.isPending ||
    updateEmployeeMutation.isPending ||
    updateUserMutation.isPending;

  useEffect(() => {
    if (searchParams.get('create') !== '1' || !canCreateEmployees || rolesQuery.isLoading || rolesQuery.isError || dialogOpen) {
      return;
    }

    setDialogMode('create');
    setSelectedEmployee(null);
    setDialogOpen(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
  }, [canCreateEmployees, dialogOpen, rolesQuery.isError, rolesQuery.isLoading, searchParams, setSearchParams]);

  const handleSubmit = (values: EmployeeFormValues) => {
    const matchedRole = roles.find((role) => role.name === values.position);

    if (dialogMode === 'create') {
      if (!matchedRole) {
        return;
      }

      createEmployeeMutation.mutate(
        {
          firstName: values.firstName,
          lastName: values.lastName,
          jmbg: values.jmbg,
          phoneNumber: values.phoneNumber,
          email: values.email,
          position: values.position,
          employmentDate: values.employmentDate,
          salary: Number(values.salary),
          password: values.password,
          roleId: matchedRole.id,
          status: values.status,
          companyId: values.companyId ? Number(values.companyId) : undefined,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        },
      );
      return;
    }

    if (!canEditEmployees || !selectedEmployee) {
      return;
    }

    if (selectedEmployee.userId && selectedLinkedUser && matchedRole) {
      updateUserMutation.mutate(
        {
          id: selectedEmployee.userId,
          data: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            roleId: matchedRole.id,
            enabled: values.enabled,
            status: values.status,
            employee: {
              jmbg: values.jmbg,
              phoneNumber: values.phoneNumber,
              position: values.position,
              employmentDate: values.employmentDate,
              salary: Number(values.salary),
              active: selectedLinkedUser.employeeActive,
            },
          },
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        },
      );
      return;
    }

    updateEmployeeMutation.mutate(
      {
        id: selectedEmployee.id,
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
          jmbg: values.jmbg,
          phoneNumber: values.phoneNumber,
          email: values.email,
          position: values.position,
          employmentDate: values.employmentDate,
          salary: Number(values.salary),
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      },
    );
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Workforce"
        title="Employees"
        description="HR manager handles employee onboarding, updates, role-to-position alignment and lifecycle changes."
        actions={
          canCreateEmployees ? (
            <Button
              variant="contained"
              disabled={rolesQuery.isLoading || rolesQuery.isError}
              onClick={() => {
                setDialogMode('create');
                setSelectedEmployee(null);
                setDialogOpen(true);
              }}
            >
              Create employee
            </Button>
          ) : null
        }
      />

      <SectionCard title="Employee list" description="">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by name, email, JMBG, phone, role or status"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Role"
              value={filters.position}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  position: event.target.value as EmployeeFiltersState['position'],
                }))
              }
              sx={{ minWidth: { xs: '100%', lg: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {employeePositionOptions.map((position) => (
                <MenuItem key={position} value={position}>
                  {position}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={filters.active}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  active: event.target.value as EmployeeFiltersState['active'],
                }))
              }
              sx={{ minWidth: { xs: '100%', lg: 160 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Account"
              value={filters.linkedUser}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  linkedUser: event.target.value as EmployeeFiltersState['linkedUser'],
                }))
              }
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="LINKED">Has account</MenuItem>
              <MenuItem value="UNLINKED">No account</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              disabled={
                employeesQuery.isFetching ||
                usersQuery.isFetching ||
                rolesQuery.isFetching ||
                companiesQuery.isFetching
              }
              onClick={() => {
                void Promise.all([
                  employeesQuery.refetch(),
                  rolesQuery.refetch(),
                  ...(canEditEmployees ? [usersQuery.refetch()] : []),
                  ...(isOverlord && dialogOpen && dialogMode === 'create'
                    ? [companiesQuery.refetch()]
                    : []),
                ]);
              }}
            >
              Refresh
            </Button>
          </Stack>

          <EmployeesTable
            rows={employeesQuery.data?.content ?? []}
            usersById={usersById}
            loading={employeesQuery.isLoading || usersQuery.isLoading || rolesQuery.isLoading}
            error={employeesQuery.isError || usersQuery.isError || rolesQuery.isError}
            onRetry={() => {
              void Promise.all([
                employeesQuery.refetch(),
                rolesQuery.refetch(),
                ...(canEditEmployees ? [usersQuery.refetch()] : []),
              ]);
            }}
            onEdit={(employee) => {
              if (!canEditEmployees) {
                return;
              }

              setDialogMode('edit');
              setSelectedEmployee(employee);
              setDialogOpen(true);
            }}
            canEdit={canEditEmployees}
            emptyTitle="No employees found"
            emptyDescription="There are no employees for the current filter combination."
            pagination={
              <ServerTablePagination
                page={employeesQuery.data}
                disabled={employeesQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
            sort={sort}
            onSortChange={handleSortChange}
          />
        </Stack>
      </SectionCard>

      <EmployeeFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedEmployee}
        linkedUser={selectedLinkedUser}
        roles={roles}
        companies={companiesQuery.data ?? []}
        companyName={auth.user?.company?.name ?? null}
        isOverlord={isOverlord}
        loading={isSaving}
        canEdit={canEditEmployees}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}