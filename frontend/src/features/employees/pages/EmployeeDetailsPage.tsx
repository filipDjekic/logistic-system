import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import { EntityDetailsLayout, DetailsField, DetailsOverviewCard, DetailsMetadataCard, RelatedDataSection, OperationalDetailsTabPanels, buildOperationalTabs } from '../../../shared/components/EntityDetails';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateEmployeeState } from '../../../core/utils/invalidateAppState';
import { formatSalary } from '../../../core/utils/formatSalary';
import { useTransportOrders } from '../../transport-orders/hooks/useTransportOrders';
import { employeesApi } from '../api/employeesApi';
import { useEmployee } from '../hooks/useEmployee';
import type {
  EmployeeShiftResponse,
  EmployeeTaskResponse,
  EmployeeUserOption,
} from '../types/employee.types';
import type { DataTableColumn } from '../../../shared/types/common.types';

type EmployeeDetailsTab = 'overview' | 'tasks' | 'shifts' | 'assignments' | 'transportActivity' | 'attachments' | 'comments' | 'audit' | 'history';


function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

export default function EmployeeDetailsPage() {
  const auth = useAuthStore();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const employeeId = Number(params.id);
  const validEmployeeId = Number.isFinite(employeeId) ? employeeId : null;
  const [activeTab, setActiveTab] = useState<EmployeeDetailsTab>('overview');

  const employeeQuery = useEmployee(validEmployeeId);

  const tasksQuery = useQuery({
    queryKey: ['employees', 'details', employeeId, 'tasks'],
    queryFn: () => employeesApi.getTasksByEmployeeId(employeeId),
    enabled: Number.isFinite(employeeId) && activeTab === 'tasks',
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const shiftsQuery = useQuery({
    queryKey: ['employees', 'details', employeeId, 'shifts'],
    queryFn: () => employeesApi.getShiftsByEmployeeId(employeeId),
    enabled: Number.isFinite(employeeId) && activeTab === 'shifts',
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'all'],
    queryFn: employeesApi.getUsers,
    enabled: auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.HR_MANAGER,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useTransportOrders(
    { assignedEmployeeId: validEmployeeId, page: 0, size: 10, sort: 'departureTime,desc' },
    Boolean(validEmployeeId) && activeTab === 'transportActivity',
  );

  const terminateMutation = useMutation({
    mutationFn: (id: number) => employeesApi.archive(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Employee archived successfully.', severity: 'success' });
      await invalidateEmployeeState(queryClient, employeeId);
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => employeesApi.restore(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Employee restored successfully.', severity: 'success' });
      await invalidateEmployeeState(queryClient, employeeId);
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const usersById = useMemo<Record<number, EmployeeUserOption>>(
    () =>
      (usersQuery.data ?? []).reduce<Record<number, EmployeeUserOption>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}),
    [usersQuery.data],
  );

  const taskColumns: DataTableColumn<EmployeeTaskResponse>[] = [
    {
      id: 'title',
      header: 'Title',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Button component={RouterLink} to={`/tasks/${row.id}`} size="small" sx={{ px: 0, minWidth: 0, fontWeight: 700 }}>
            {row.title}
          </Button>
          <Typography variant="caption" color="text.secondary">{row.description || 'No description'}</Typography>
        </Stack>
      ),
    },
    { id: 'dueDate', header: 'Due date', minWidth: 180, render: (row) => formatDateTime(row.dueDate) },
    { id: 'priority', header: 'Priority', minWidth: 120, render: (row) => <StatusChip value={row.priority} /> },
    { id: 'status', header: 'Status', minWidth: 140, render: (row) => <StatusChip value={row.status} /> },
    {
      id: 'transportOrderId',
      header: 'Transport order',
      minWidth: 140,
      render: (row) => row.transportOrderId == null ? '—' : <Button size="small" component={RouterLink} to={`/transport-orders/${row.transportOrderId}`}>#{row.transportOrderId}</Button>,
    },
  ];

  const shiftColumns: DataTableColumn<EmployeeShiftResponse>[] = [
    { id: 'startTime', header: 'Start', minWidth: 180, render: (row) => formatDateTime(row.startTime) },
    { id: 'endTime', header: 'End', minWidth: 180, render: (row) => formatDateTime(row.endTime) },
    { id: 'status', header: 'Status', minWidth: 140, render: (row) => <StatusChip value={row.status} /> },
    { id: 'notes', header: 'Notes', minWidth: 280, render: (row) => row.notes || '—' },
  ];

  if (!Number.isFinite(employeeId)) {
    return <ErrorState title="Invalid employee" description="The employee ID in the route is not valid." />;
  }

  if (employeeQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Workforce"
        title="Employee details"
        actionItems={[{ key: 'back', label: 'Back to list', to: '/employees' }]}
      >
        <SectionCard><Typography color="text.secondary">Loading employee details...</Typography></SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <ErrorState
        title="Employee could not be loaded"
        description="The requested employee details are not available."
        onRetry={() => { void employeeQuery.refetch(); }}
      />
    );
  }

  const employee = employeeQuery.data;
  const linkedUser = employee.userId ? usersById[employee.userId] : null;
  const canTerminateEmployee = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.HR_MANAGER;
  const canViewHistory = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.HR_MANAGER;
  const canManageOperationalNotes = canViewHistory || auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const tabs: { value: string; label: ReactNode; disabled?: boolean }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'tasks', label: `Tasks${tasksQuery.data ? ` (${tasksQuery.data.length})` : ''}` },
    { value: 'shifts', label: `Shifts${shiftsQuery.data ? ` (${shiftsQuery.data.length})` : ''}` },
    { value: 'transportActivity', label: `Transport activity${transportOrdersQuery.data ? ` (${transportOrdersQuery.data.totalElements})` : ''}` },
    ...buildOperationalTabs({ entityType: 'EMPLOYEE', entityName: 'EMPLOYEE', entityId: employee.id, allowCreateAttachments: canManageOperationalNotes, allowCreateComments: canManageOperationalNotes }),
  ];

  return (
    <EntityDetailsLayout
      title={`${employee.firstName} ${employee.lastName}`}
      breadcrumbs={[{ label: 'Employees', to: '/employees' }, { label: `${employee.firstName} ${employee.lastName}` }]}
      hero={{
        overline: 'Workforce',
        title: `${employee.firstName} ${employee.lastName}`,
        subtitle: `${employee.position} • ${employee.companyName ?? 'No company'}`,
        status: employee.active ? 'ACTIVE' : 'INACTIVE',
        primaryInfo: [
          { label: 'Email', value: employee.email },
          { label: 'Phone', value: `${employee.phoneCode ?? ''} ${employee.phoneNumber}`.trim() },
          { label: 'Primary warehouse', value: employee.primaryWarehouseName ?? (employee.primaryWarehouseId ? `Warehouse #${employee.primaryWarehouseId}` : '—') },
        ],
      }}
      actionItems={[
        { key: 'back', label: 'Back to list', to: '/employees' },
        ...(canTerminateEmployee && employee.active ? [{ key: 'archive', label: 'Archive employee', color: 'warning' as const, variant: 'contained' as const, disabled: terminateMutation.isPending, onClick: () => terminateMutation.mutate(employee.id) }] : []),
        ...(canTerminateEmployee && !employee.active ? [{ key: 'restore', label: 'Restore employee', color: 'success' as const, variant: 'contained' as const, disabled: restoreMutation.isPending, onClick: () => restoreMutation.mutate(employee.id) }] : []),
      ]}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as EmployeeDetailsTab)}
    >
      {!employee.active ? <ArchivedEntityAlert entityLabel="Employee" /> : null}

      {activeTab === 'overview' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <DetailsOverviewCard title="Employee overview" description="Employment, contact and assignment data.">
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="First name" value={employee.firstName} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Last name" value={employee.lastName} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Email" value={employee.email} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Phone number" value={`${employee.phoneCode ?? ''} ${employee.phoneNumber}`.trim()} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="JMBG" value={employee.jmbg} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Position" value={employee.position} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Employment date" value={employee.employmentDate} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Salary" value={formatSalary(employee.salary, employee.salaryCurrencyCode)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Active" value={<StatusChip value={employee.active ? 'ACTIVE' : 'INACTIVE'} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Company" value={employee.companyName ?? '—'} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Primary warehouse" value={employee.primaryWarehouseId ? <Button component={RouterLink} to={`/warehouses/${employee.primaryWarehouseId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{employee.primaryWarehouseName ?? `Warehouse #${employee.primaryWarehouseId}`}</Button> : '—'} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><DetailsField label="Location" value={`${employee.cityName ?? employee.city ?? '—'}${employee.countryCode ? `, ${employee.countryCode}` : ''}`} /></Grid>
              </Grid>
            </DetailsOverviewCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <DetailsMetadataCard title="Linked user details" description="Account connected to this employee record.">
              <Stack spacing={2}>
                <DetailsField label="Linked user" value={employee.userId == null ? '—' : <Button component={RouterLink} to={`/users/${employee.userId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{linkedUser ? `${linkedUser.firstName} ${linkedUser.lastName} (${linkedUser.email})` : `User #${employee.userId}`}</Button>} />
                <DetailsField label="Role" value={linkedUser?.roleName ?? '—'} />
                <DetailsField label="Enabled" value={linkedUser ? <StatusChip value={linkedUser.enabled ? 'ACTIVE' : 'INACTIVE'} /> : '—'} />
                <DetailsField label="User status" value={linkedUser?.status ?? '—'} />
              </Stack>
            </DetailsMetadataCard>
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'tasks' ? (
        <RelatedDataSection title="Assigned tasks" description="Operational tasks assigned to this employee.">
          <DataTable
            columns={taskColumns}
            rows={tasksQuery.data ?? []}
            getRowId={(row) => row.id}
            loading={tasksQuery.isLoading}
            error={tasksQuery.isError}
            onRetry={() => { void tasksQuery.refetch(); }}
            emptyTitle="No tasks found"
            emptyDescription="This employee currently has no assigned tasks."
          />
        </RelatedDataSection>
      ) : null}

      {activeTab === 'shifts' ? (
        <RelatedDataSection title="Assigned shifts" description="Work shifts connected with this employee.">
          <DataTable
            columns={shiftColumns}
            rows={shiftsQuery.data ?? []}
            getRowId={(row) => row.id}
            loading={shiftsQuery.isLoading}
            error={shiftsQuery.isError}
            onRetry={() => { void shiftsQuery.refetch(); }}
            emptyTitle="No shifts found"
            emptyDescription="This employee currently has no assigned shifts."
          />
        </RelatedDataSection>
      ) : null}

      {activeTab === 'transportActivity' ? (
        <RelatedDataSection
          title="Transport activity"
          description="Transport orders where this employee is assigned as driver/operator."
          action={<Button variant="outlined" onClick={() => navigate('/transport-orders')}>Open transports</Button>}
          loading={transportOrdersQuery.isLoading}
          error={transportOrdersQuery.isError}
          onRetry={() => { void transportOrdersQuery.refetch(); }}
          empty={!transportOrdersQuery.isLoading && !transportOrdersQuery.isError && (transportOrdersQuery.data?.content ?? []).length === 0}
          emptyTitle="No transport activity"
        >
          <Stack spacing={1.25}>
            {(transportOrdersQuery.data?.content ?? []).map((order) => (
              <Stack key={order.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={800}>{order.orderNumber}</Typography>
                <Typography variant="body2" color="text.secondary">{order.description}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StatusChip value={order.status} />
                  <Button size="small" onClick={() => navigate(`/transport-orders/${order.id}`)}>Open</Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </RelatedDataSection>
      ) : null}

      <OperationalDetailsTabPanels
        activeTab={activeTab}
        entityType="EMPLOYEE"
        entityName="EMPLOYEE"
        entityId={employee.id}
        allowCreateAttachments={canManageOperationalNotes}
        allowCreateComments={canManageOperationalNotes}
      />
    </EntityDetailsLayout>
  );
}
