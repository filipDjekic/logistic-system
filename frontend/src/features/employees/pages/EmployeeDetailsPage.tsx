import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { employeesApi } from '../api/employeesApi';
import { useEmployee } from '../hooks/useEmployee';
import type {
  EmployeeShiftResponse,
  EmployeeTaskResponse,
  EmployeeUserOption,
} from '../types/employee.types';
import type { DataTableColumn } from '../../../shared/types/common.types';

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const employeeId = Number(params.id);

  const employeeQuery = useEmployee(Number.isFinite(employeeId) ? employeeId : null);

  const tasksQuery = useQuery({
    queryKey: ['employees', 'details', employeeId, 'tasks'],
    queryFn: () => employeesApi.getTasksByEmployeeId(employeeId),
    enabled: Number.isFinite(employeeId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const shiftsQuery = useQuery({
    queryKey: ['employees', 'details', employeeId, 'shifts'],
    queryFn: () => employeesApi.getShiftsByEmployeeId(employeeId),
    enabled: Number.isFinite(employeeId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'all'],
    queryFn: employeesApi.getUsers,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const terminateMutation = useMutation({
    mutationFn: (id: number) => employeesApi.terminate(id),
    onSuccess: async () => {
      showSnackbar({
        message: 'Employee terminated successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: ['employees', 'details', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ]);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
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
          <Typography variant="body2" fontWeight={700}>
            {row.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.description || 'No description'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'dueDate',
      header: 'Due date',
      minWidth: 180,
      render: (row) => formatDateTime(row.dueDate),
    },
    {
      id: 'priority',
      header: 'Priority',
      minWidth: 120,
      render: (row) => <StatusChip value={row.priority} />,
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <StatusChip value={row.status} />,
    },
    {
      id: 'transportOrderId',
      header: 'Transport order',
      minWidth: 140,
      render: (row) => (row.transportOrderId == null ? '—' : row.transportOrderId),
    },
  ];

  const shiftColumns: DataTableColumn<EmployeeShiftResponse>[] = [
    {
      id: 'startTime',
      header: 'Start',
      minWidth: 180,
      render: (row) => formatDateTime(row.startTime),
    },
    {
      id: 'endTime',
      header: 'End',
      minWidth: 180,
      render: (row) => formatDateTime(row.endTime),
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <StatusChip value={row.status} />,
    },
    {
      id: 'notes',
      header: 'Notes',
      minWidth: 280,
      render: (row) => row.notes || '—',
    },
  ];

  if (!Number.isFinite(employeeId)) {
    return (
      <ErrorState
        title="Invalid employee"
        description="The employee ID in the route is not valid."
      />
    );
  }

  if (employeeQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Workforce"
          title="Employee details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/employees')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading employee details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <ErrorState
        title="Employee could not be loaded"
        description="The requested employee details are not available."
        onRetry={() => {
          void employeeQuery.refetch();
        }}
      />
    );
  }

  const employee = employeeQuery.data;
  const linkedUser = employee.userId ? usersById[employee.userId] : null;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Workforce"
        title={`${employee.firstName} ${employee.lastName}`}
        description={`Employee #${employee.id}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/employees" variant="outlined">
              Back to list
            </Button>

            <Button
              variant="contained"
              color="warning"
              disabled={terminateMutation.isPending}
              onClick={() => terminateMutation.mutate(employee.id)}
            >
              Terminate employee
            </Button>
          </Stack>
        }
      />

      <Alert severity="info">
        The backend supports employee termination, but the current employee response does not expose
        the employee active flag. Because of that, this screen can execute terminate action, but it
        cannot render a confirmed active/inactive chip after refetch.
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard
            title="Employee overview"
            description="Confirmed fields from the backend employee response."
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="First name" value={employee.firstName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Last name" value={employee.lastName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Email" value={employee.email} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Phone number" value={employee.phoneNumber} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="JMBG" value={employee.jmbg} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Position" value={employee.position} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Employment date" value={employee.employmentDate} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Salary" value={formatCurrency(employee.salary)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <InfoRow
                  label="Linked user"
                  value={
                    employee.userId == null
                      ? '—'
                      : linkedUser
                        ? `${linkedUser.firstName} ${linkedUser.lastName} (${linkedUser.email})`
                        : `User #${employee.userId}`
                  }
                />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionCard
            title="Linked user details"
            description="Resolved from the confirmed /api/users endpoint."
          >
            <Stack spacing={2}>
              <InfoRow label="User ID" value={employee.userId ?? '—'} />
              <InfoRow label="Role" value={linkedUser?.roleName ?? '—'} />
              <InfoRow label="Enabled" value={linkedUser ? String(linkedUser.enabled) : '—'} />
              <InfoRow label="User status" value={linkedUser?.status ?? '—'} />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Assigned tasks"
        description="Uses the confirmed employee tasks endpoint."
      >
        <DataTable
          columns={taskColumns}
          rows={tasksQuery.data ?? []}
          getRowId={(row) => row.id}
          loading={tasksQuery.isLoading}
          error={tasksQuery.isError}
          onRetry={() => {
            void tasksQuery.refetch();
          }}
          emptyTitle="No tasks found"
          emptyDescription="This employee currently has no assigned tasks."
          minWidth={980}
        />
      </SectionCard>

      <SectionCard
        title="Shift history"
        description="Uses the confirmed employee shifts endpoint."
      >
        <DataTable
          columns={shiftColumns}
          rows={shiftsQuery.data ?? []}
          getRowId={(row) => row.id}
          loading={shiftsQuery.isLoading}
          error={shiftsQuery.isError}
          onRetry={() => {
            void shiftsQuery.refetch();
          }}
          emptyTitle="No shifts found"
          emptyDescription="This employee currently has no recorded shifts."
          minWidth={900}
        />
      </SectionCard>
    </Stack>
  );
}