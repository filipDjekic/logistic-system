import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useCompanies } from '../../companies/hooks/useCompanies';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import OperationalMetrics from '../../../shared/components/OperationalMetrics/OperationalMetrics';
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

  const canEditEmployees =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.HR_MANAGER;
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

  const rows = employeesQuery.data?.content ?? [];
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.position !== 'ALL' ||
    filters.active !== 'ALL' ||
    filters.linkedUser !== 'ALL';

  const clearFilters = () => {
    setPage(0);
    setFilters({
      search: '',
      position: 'ALL',
      active: 'ALL',
      linkedUser: 'ALL',
    });
  };

  const activeFilterChips = [
    ...(filters.search.trim()
      ? [{ key: 'search', label: `Search: ${filters.search.trim()}`, onDelete: () => setFilters((prev) => ({ ...prev, search: '' })) }]
      : []),
    ...(filters.position !== 'ALL'
      ? [{ key: 'position', label: `Role: ${filters.position}`, onDelete: () => setFilters((prev) => ({ ...prev, position: 'ALL' })) }]
      : []),
    ...(filters.active !== 'ALL'
      ? [{ key: 'active', label: `Status: ${filters.active}`, onDelete: () => setFilters((prev) => ({ ...prev, active: 'ALL' })) }]
      : []),
    ...(filters.linkedUser !== 'ALL'
      ? [{ key: 'linkedUser', label: `Account: ${filters.linkedUser}`, onDelete: () => setFilters((prev) => ({ ...prev, linkedUser: 'ALL' })) }]
      : []),
  ];


  const employeeMetrics = useMemo(() => {
    const activeEmployees = rows.filter((employee) => employee.active).length;
    const drivers = rows.filter((employee) => employee.position === 'DRIVER').length;
    const workers = rows.filter((employee) => employee.position === 'WORKER').length;
    const warehouseManagers = rows.filter((employee) => employee.position === 'WAREHOUSE_MANAGER').length;
    const employeesWithoutWarehouse = rows.filter((employee) =>
      (employee.position === 'WORKER' || employee.position === 'WAREHOUSE_MANAGER') && !employee.primaryWarehouseId,
    ).length;

    return [
      {
        label: 'Active workforce',
        value: activeEmployees,
        helper: `${rows.length - activeEmployees} inactive employees on current page`,
        tone: activeEmployees > 0 ? 'success' as const : 'warning' as const,
        status: activeEmployees > 0 ? 'ACTIVE' : 'INACTIVE',
      },
      {
        label: 'Operations roles',
        value: drivers + workers + warehouseManagers,
        helper: `${drivers} drivers · ${workers} workers · ${warehouseManagers} managers`,
        tone: 'info' as const,
      },
      {
        label: 'Warehouse scope gaps',
        value: employeesWithoutWarehouse,
        helper: 'Workers/managers without primary warehouse on current page',
        tone: employeesWithoutWarehouse > 0 ? 'warning' as const : 'success' as const,
      },
    ];
  }, [rows]);

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
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          jmbg: values.jmbg.trim(),
          phoneNumber: values.phoneNumber.trim(),
          email: values.email.trim(),
          address: values.address?.trim() || null,
          cityId: values.cityId ? Number(values.cityId) : null,
          city: values.city?.trim() || null,
          postalCode: values.postalCode?.trim() || null,
          countryId: values.countryId ? Number(values.countryId) : null,
          timezoneId: values.timezoneId ? Number(values.timezoneId) : null,
          primaryWarehouseId: values.primaryWarehouseId ? Number(values.primaryWarehouseId) : null,
          position: values.position,
          employmentDate: values.employmentDate,
          salary: Number(values.salary),
          password: values.password.trim(),
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
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            roleId: matchedRole.id,
            enabled: values.enabled,
            status: values.status,
            employee: {
              jmbg: values.jmbg.trim(),
              phoneNumber: values.phoneNumber.trim(),
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
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          jmbg: values.jmbg.trim(),
          address: values.address?.trim() || null,
          cityId: values.cityId ? Number(values.cityId) : null,
          city: values.city?.trim() || null,
          postalCode: values.postalCode?.trim() || null,
          countryId: values.countryId ? Number(values.countryId) : null,
          timezoneId: values.timezoneId ? Number(values.timezoneId) : null,
          primaryWarehouseId: values.primaryWarehouseId ? Number(values.primaryWarehouseId) : null,
          phoneNumber: values.phoneNumber.trim(),
          email: values.email.trim(),
          position: values.position,
          employmentDate: values.employmentDate,
          salary: Number(values.salary),
          applyGeneratedEmailSuggestion: values.applyGeneratedEmailSuggestion,
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

      <OperationalMetrics items={employeeMetrics} />

      <TableLayout
        title="Employee list"
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => {
              setPage(0);
              setFilters((prev) => ({ ...prev, search: value }));
            }}
            searchPlaceholder="Search by name, email, JMBG, phone, role or status"
            onRefresh={() => {
              void Promise.all([
                employeesQuery.refetch(),
                rolesQuery.refetch(),
                ...(canEditEmployees ? [usersQuery.refetch()] : []),
                ...(isOverlord && dialogOpen && dialogMode === 'create' ? [companiesQuery.refetch()] : []),
              ]);
            }}
            refreshDisabled={employeesQuery.isFetching || usersQuery.isFetching || rolesQuery.isFetching || companiesQuery.isFetching}
            onClearFilters={clearFilters}
            clearDisabled={employeesQuery.isFetching || usersQuery.isFetching || rolesQuery.isFetching || companiesQuery.isFetching || !hasActiveFilters}
            activeFilters={activeFilterChips}
          />
        }
        filters={
          <FilterPanel minColumnWidth={180}>
            <TextField
              select
              size="small"
              label="Role"
              value={filters.position}
              onChange={(event) => {
                setPage(0);
                setFilters((prev) => ({
                  ...prev,
                  position: event.target.value as EmployeeFiltersState['position'],
                }));
              }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {employeePositionOptions.map((position) => (
                <MenuItem key={position} value={position}>{position}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.active}
              onChange={(event) => {
                setPage(0);
                setFilters((prev) => ({
                  ...prev,
                  active: event.target.value as EmployeeFiltersState['active'],
                }));
              }}
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
              onChange={(event) => {
                setPage(0);
                setFilters((prev) => ({
                  ...prev,
                  linkedUser: event.target.value as EmployeeFiltersState['linkedUser'],
                }));
              }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="LINKED">Has account</MenuItem>
              <MenuItem value="UNLINKED">No account</MenuItem>
            </TextField>
          </FilterPanel>
        }
        table={
          <EmployeesTable
            rows={rows}
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
              if (!canEditEmployees) return;
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
        }
      />

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
        serverError={createEmployeeMutation.error ?? updateEmployeeMutation.error ?? updateUserMutation.error}
        canEdit={canEditEmployees}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}