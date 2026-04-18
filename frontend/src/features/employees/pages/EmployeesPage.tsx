import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useUpdateUser } from '../../users/hooks/useUpdateUser';
import EmployeeFormDialog from '../components/EmployeeFormDialog';
import EmployeesTable from '../components/EmployeesTable';
import { employeesApi } from '../api/employeesApi';
import { useCreateEmployee } from '../hooks/useCreateEmployee';
import { useEmployees } from '../hooks/useEmployees';
import { useUpdateEmployee } from '../hooks/useUpdateEmployee';
import type {
  EmployeeFiltersState,
  EmployeeResponse,
  EmployeeRoleOption,
  EmployeeUserOption,
} from '../types/employee.types';
import { employeePositionOptions, type EmployeeFormValues } from '../validation/employeeSchema';

export default function EmployeesPage() {
  const auth = useAuthStore();
  const canEditEmployees = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.HR_MANAGER;
  const canCreateEmployees =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.HR_MANAGER ||
    auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<EmployeeFiltersState>({
    search: '',
    position: 'ALL',
    linkedUser: 'ALL',
  });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const employeesQuery = useEmployees(true);

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

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (employeesQuery.data ?? []).filter((employee) => {
      const matchesPosition =
        filters.position === 'ALL' || employee.position === filters.position;

      const matchesLinkedUser =
        filters.linkedUser === 'ALL' ||
        (filters.linkedUser === 'LINKED' && employee.userId != null) ||
        (filters.linkedUser === 'UNLINKED' && employee.userId == null);

      const linkedUser = employee.userId != null ? usersById[employee.userId] : null;

      const matchesSearch =
        search.length === 0 ||
        employee.firstName.toLowerCase().includes(search) ||
        employee.lastName.toLowerCase().includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        employee.jmbg.toLowerCase().includes(search) ||
        employee.phoneNumber.toLowerCase().includes(search) ||
        employee.position.toLowerCase().includes(search) ||
        String(employee.id).includes(search) ||
        String(employee.userId ?? '').includes(search) ||
        linkedUser?.status.toLowerCase().includes(search) ||
        linkedUser?.roleName.toLowerCase().includes(search) ||
        false;

      return matchesPosition && matchesLinkedUser && matchesSearch;
    });
  }, [employeesQuery.data, filters, usersById]);

  const selectedLinkedUser = useMemo(() => {
    if (!selectedEmployee?.userId) {
      return null;
    }

    return usersById[selectedEmployee.userId] ?? null;
  }, [selectedEmployee?.userId, usersById]);

  const isSaving =
    createEmployeeMutation.isPending ||
    updateEmployeeMutation.isPending ||
    updateUserMutation.isPending;

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
              disabled={employeesQuery.isFetching || usersQuery.isFetching || rolesQuery.isFetching}
              onClick={() => {
                void Promise.all([
                  employeesQuery.refetch(),
                  rolesQuery.refetch(),
                  ...(canEditEmployees ? [usersQuery.refetch()] : []),
                ]);
              }}
            >
              Refresh
            </Button>
          </Stack>

          <EmployeesTable
            rows={filteredRows}
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
          />
        </Stack>
      </SectionCard>

      <EmployeeFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedEmployee}
        linkedUser={selectedLinkedUser}
        roles={roles}
        companyName={auth.user?.company?.name ?? null}
        loading={isSaving}
        canEdit={canEditEmployees}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
