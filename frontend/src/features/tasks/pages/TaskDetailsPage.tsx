import { useMemo } from 'react';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import TaskStatusChip from '../components/TaskStatusChip';
import { useTask } from '../hooks/useTask';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { normalizeApiError } from '../../../core/api/apiError';
import { employeesApi } from '../../employees/api/employeesApi';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function TaskDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const taskId = Number(params.id);
  const isValidTaskId = Number.isInteger(taskId) && taskId > 0;

  const taskQuery = useTask(isValidTaskId ? taskId : null);
  const updateTaskStatusMutation = useUpdateTaskStatus();

  const canViewHistory =
    auth.user?.role !== ROLES.DRIVER && auth.user?.role !== ROLES.WORKER;

  const canResolveEmployee =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;

  const canResolveTransportOrder =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER ||
    auth.user?.role === ROLES.DRIVER;

  const canResolveStockMovement =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const canUpdateStatus =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.DISPATCHER ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER ||
    auth.user?.role === ROLES.WORKER ||
    auth.user?.role === ROLES.DRIVER;

  const employeesQuery = useQuery({
    queryKey: ['task-details', 'employees'],
    queryFn: () => employeesApi.getAll({ size: 1000, sort: 'lastName,asc' }),
    enabled: isValidTaskId && canResolveEmployee,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useQuery({
    queryKey: ['task-details', 'transport-orders'],
    queryFn: () => transportOrdersApi.getAll({ size: 1000, sort: 'createdAt,desc' }),
    enabled: isValidTaskId && canResolveTransportOrder,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const stockMovementsQuery = useQuery({
    queryKey: ['task-details', 'stock-movements'],
    queryFn: () => stockMovementsApi.getAll({ size: 1000, sort: 'createdAt,desc' }),
    enabled: isValidTaskId && canResolveStockMovement,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const assignedEmployee = useMemo(
    () => (employeesQuery.data?.content ?? []).find((row) => row.id === taskQuery.data?.assignedEmployeeId),
    [employeesQuery.data, taskQuery.data?.assignedEmployeeId],
  );

  const transportOrder = useMemo(
    () => (transportOrdersQuery.data?.content ?? []).find((row) => row.id === taskQuery.data?.transportOrderId),
    [taskQuery.data?.transportOrderId, transportOrdersQuery.data],
  );

  const stockMovement = useMemo(
    () => (stockMovementsQuery.data?.content ?? []).find((row) => row.id === taskQuery.data?.stockMovementId),
    [taskQuery.data?.stockMovementId, stockMovementsQuery.data],
  );

  if (!isValidTaskId) {
    return (
      <ErrorState
        title="Invalid task"
        description="The task ID in the route must be a positive integer."
      />
    );
  }

  if (taskQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Operations"
          title="Task Details"
          actions={<Button variant="outlined" onClick={() => navigate('/tasks')}>Back to list</Button>}
        />
        <SectionCard>
          <Typography color="text.secondary">Loading task details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    const error = normalizeApiError(
      taskQuery.error,
      'The task could not be loaded from the backend.',
    );

    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Operations"
          title="Task Details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/tasks')}>
              Back to list
            </Button>
          }
        />
        <ErrorState
          title={
            error.status === 403
              ? 'Access denied'
              : error.status === 404
                ? 'Task not found'
                : 'Task could not be loaded'
          }
          description={error.message}
        details={error.fieldErrors}
          onRetry={() => void taskQuery.refetch()}
        />
      </Stack>
    );
  }

  const task = taskQuery.data;

  const statusActions = canUpdateStatus
    ? task.status === 'NEW'
      ? [
          { label: 'Start task', status: 'IN_PROGRESS' as const },
          { label: 'Cancel task', status: 'CANCELLED' as const },
        ]
      : task.status === 'IN_PROGRESS'
        ? [
            { label: 'Complete task', status: 'COMPLETED' as const },
            { label: 'Cancel task', status: 'CANCELLED' as const },
          ]
        : []
    : [];

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title={task.title}
        description="Review task details and linked transport or stock movement context."
        actions={
          <Stack direction="row" spacing={1}>
            {canViewHistory ? (
              <Button
                variant="outlined"
                onClick={() => navigate(`/change-history?entityName=TASK&entityId=${task.id}`)}
              >
                View history
              </Button>
            ) : null}
            <Button variant="outlined" onClick={() => navigate('/tasks')}>Back to list</Button>
          </Stack>
        }
      />

      <SectionCard title="Task overview">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Typography>{task.priority}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <TaskStatusChip status={task.status} />
              {statusActions.map((action) => (
                <Button
                  key={action.status}
                  size="small"
                  variant="outlined"
                  disabled={updateTaskStatusMutation.isPending}
                  onClick={() => {
                    updateTaskStatusMutation.mutate({ id: task.id, status: action.status });
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Assigned employee</Typography>
            <Typography>
              {assignedEmployee
                ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}`
                : `Employee #${task.assignedEmployeeId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assignedEmployee ? `${assignedEmployee.email} · ${assignedEmployee.position}` : '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Due date</Typography>
            <Typography>{formatDateTime(task.dueDate)}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography>{task.description || '—'}</Typography>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Linked process">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Transport order</Typography>
            <Typography>
              {transportOrder
                ? `${transportOrder.orderNumber} (${transportOrder.status})`
                : task.transportOrderId ?? '—'}
            </Typography>
            {task.transportOrderId != null ? (
              <Stack direction="row" sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/transport-orders/${task.transportOrderId}`)}
                >
                  Open transport order
                </Button>
              </Stack>
            ) : null}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Stock movement</Typography>
            <Typography>
              {stockMovement
                ? `${stockMovement.movementType} #${stockMovement.id}`
                : task.stockMovementId ?? '—'}
            </Typography>
            {stockMovement ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stockMovement.productName} · {stockMovement.warehouseName}
              </Typography>
            ) : null}
          </Grid>
        </Grid>
      </SectionCard>
    </Stack>
  );
}