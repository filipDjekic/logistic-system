import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import ArchiveStatusBadge from '../../../shared/components/archive/ArchiveStatusBadge';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateEmployeeState } from '../../../core/utils/invalidateAppState';
import { useEmployeeWarehouseAssignmentsByEmployee } from '../../employee-warehouse-assignments/hooks/useEmployeeWarehouseAssignments';
import { useTransportOrders } from '../../transport-orders/hooks/useTransportOrders';
import { employeesApi } from '../api/employeesApi';
import { useEmployee } from '../hooks/useEmployee';
import type {
  EmployeeShiftResponse,
  EmployeeTaskResponse,
  EmployeeUserOption,
} from '../types/employee.types';
import type { DataTableColumn } from '../../../shared/types/common.types';

type EmployeeDetailsTab = 'overview' | 'tasks' | 'shifts' | 'assignments' | 'transportActivity' | 'commentsAttachments' | 'domainEvents' | 'changeHistory';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 2,
  }).format(value);
}

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

  const assignmentsQuery = useEmployeeWarehouseAssignmentsByEmployee(activeTab === 'assignments' ? validEmployeeId : null);
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
        actions={<Button variant="outlined" onClick={() => navigate('/employees')}>Back to list</Button>}
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
  const canManageOperationalNotes = canViewHistory || auth.user?.role === ROLES.DISPATCHER || auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const employeeRecommendedStep = (() => {
    if (!employee.active) {
      return {
        title: 'Employee is inactive.',
        description: 'Review tasks, shifts and warehouse assignments to ensure no active operational work is still assigned to this employee.',
        severity: 'warning' as const,
        actions: [
          { label: 'Open tasks', onClick: () => setActiveTab('tasks'), variant: 'outlined' as const },
          { label: 'Open shifts', onClick: () => setActiveTab('shifts'), variant: 'outlined' as const },
        ],
      };
    }

    if (!employee.userId) {
      return {
        title: 'Link this employee with a user account if system access is required.',
        description: 'The employee record exists, but no user account is linked. Operational assignment is possible, but login-based execution depends on user linkage.',
        severity: 'info' as const,
        actions: [{ label: 'Open users', to: '/users', variant: 'outlined' as const }],
      };
    }

    if (!employee.primaryWarehouseId && (employee.position ?? '').toLowerCase().includes('warehouse')) {
      return {
        title: 'Assign warehouse access for warehouse work.',
        description: 'This employee looks warehouse-related but has no primary warehouse. Add warehouse assignment before relying on this employee for warehouse tasks.',
        severity: 'warning' as const,
        actions: [{ label: 'Open assignments', onClick: () => setActiveTab('assignments') }],
      };
    }

    return {
      title: 'Review current workload and schedule.',
      description: 'Use tasks and shifts to confirm what this employee is responsible for next.',
      severity: 'info' as const,
      actions: [
        { label: 'Open tasks', onClick: () => setActiveTab('tasks') },
        { label: 'Open shifts', onClick: () => setActiveTab('shifts'), variant: 'outlined' as const },
      ],
    };
  })();

  const tabs: { value: EmployeeDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'tasks', label: `Tasks${tasksQuery.data ? ` (${tasksQuery.data.length})` : ''}` },
    { value: 'shifts', label: `Shifts${shiftsQuery.data ? ` (${shiftsQuery.data.length})` : ''}` },
    { value: 'assignments', label: `Warehouse assignments${assignmentsQuery.data ? ` (${assignmentsQuery.data.length})` : ''}` },
    { value: 'transportActivity', label: `Transport activity${transportOrdersQuery.data ? ` (${transportOrdersQuery.data.totalElements})` : ''}` },
    { value: 'commentsAttachments', label: 'Comments & attachments' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Workforce"
      title={`${employee.firstName} ${employee.lastName}`}
      description={`${employee.position} • ${employee.companyName ?? 'No company'}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as EmployeeDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button component={RouterLink} to="/employees" variant="outlined">Back to list</Button>
          {canViewHistory ? (
            <Button variant="outlined" component={RouterLink} to={`/change-history?entityName=EMPLOYEE&entityId=${employee.id}`}>Full history</Button>
          ) : null}
          <ArchiveStatusBadge archived={!employee.active} />
          {canTerminateEmployee && employee.active ? (
            <Button variant="contained" color="warning" disabled={terminateMutation.isPending} onClick={() => terminateMutation.mutate(employee.id)}>
              Archive employee
            </Button>
          ) : null}
          {canTerminateEmployee && !employee.active ? (
            <Button variant="contained" color="success" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(employee.id)}>
              Restore employee
            </Button>
          ) : null}
        </Stack>
      }
    >
      {!employee.active ? <ArchivedEntityAlert entityLabel="Employee" /> : null}
      <RecommendedNextStep {...employeeRecommendedStep} />

      {activeTab === 'overview' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <SectionCard title="Employee overview">
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="First name" value={employee.firstName} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Last name" value={employee.lastName} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Email" value={employee.email} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Phone number" value={`${employee.phoneCode ?? ''} ${employee.phoneNumber}`.trim()} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="JMBG" value={employee.jmbg} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Position" value={employee.position} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Employment date" value={employee.employmentDate} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Salary" value={formatCurrency(employee.salary)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Active" value={<StatusChip value={employee.active ? 'ACTIVE' : 'INACTIVE'} />} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Company" value={employee.companyName ?? '—'} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Primary warehouse" value={employee.primaryWarehouseId ? <Button component={RouterLink} to={`/warehouses/${employee.primaryWarehouseId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{employee.primaryWarehouseName ?? `Warehouse #${employee.primaryWarehouseId}`}</Button> : '—'} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Location" value={`${employee.cityName ?? employee.city ?? '—'}${employee.countryCode ? `, ${employee.countryCode}` : ''}`} /></Grid>
              </Grid>
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <SectionCard title="Linked user details">
              <Stack spacing={2}>
                <InfoRow label="Linked user" value={employee.userId == null ? '—' : <Button component={RouterLink} to={`/users/${employee.userId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{linkedUser ? `${linkedUser.firstName} ${linkedUser.lastName} (${linkedUser.email})` : `User #${employee.userId}`}</Button>} />
                <InfoRow label="Role" value={linkedUser?.roleName ?? '—'} />
                <InfoRow label="Enabled" value={linkedUser ? <StatusChip value={linkedUser.enabled ? 'ACTIVE' : 'INACTIVE'} /> : '—'} />
                <InfoRow label="User status" value={linkedUser?.status ?? '—'} />
              </Stack>
            </SectionCard>
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

      {activeTab === 'assignments' ? (
        <RelatedDataSection
          title="Warehouse assignments"
          description="Warehouse access and assignment context for this employee."
          action={<Button variant="outlined" onClick={() => navigate('/employee-warehouse-assignments')}>Open assignments</Button>}
          loading={assignmentsQuery.isLoading}
          error={assignmentsQuery.isError}
          onRetry={() => { void assignmentsQuery.refetch(); }}
          empty={!assignmentsQuery.isLoading && !assignmentsQuery.isError && (assignmentsQuery.data ?? []).length === 0}
          emptyTitle="No warehouse assignments"
        >
          <Stack spacing={1.25}>
            {(assignmentsQuery.data ?? []).map((assignment) => (
              <Stack key={assignment.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={800}>{assignment.warehouseName}</Typography>
                <Typography variant="body2" color="text.secondary">{assignment.accessType} · {assignment.active ? 'Active' : 'Inactive'}</Typography>
                <Button size="small" onClick={() => navigate(`/warehouses/${assignment.warehouseId}`)} sx={{ alignSelf: 'flex-start' }}>Open warehouse</Button>
              </Stack>
            ))}
          </Stack>
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

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}><CommentsPanel entityType="EMPLOYEE" entityId={employee.id} allowCreate={canManageOperationalNotes} /></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><AttachmentsPanel entityType="EMPLOYEE" entityId={employee.id} allowCreate={canManageOperationalNotes} /></Grid>
        </Grid>
      ) : null}

      {activeTab === 'domainEvents' ? <DomainEventsPanel entityType="EMPLOYEE" entityId={employee.id} /> : null}

      {activeTab === 'changeHistory' ? <ChangeHistoryPanel entityName="EMPLOYEE" entityId={employee.id} /> : null}
    </EntityDetailsLayout>
  );
}
