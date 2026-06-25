import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getAllowedTaskStatusTransitions } from '../../../core/permissions/operationGuards';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { StickyMobileActions } from '../../../shared/components/Mobile';
import { ForbiddenTransitionHint, LifecycleHistoryTimeline, LifecycleTransitionDialog } from '../../../shared/components/Lifecycle';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import { employeesApi } from '../../employees/api/employeesApi';
import TaskStatusChip from '../components/TaskStatusChip';
import { useTask } from '../hooks/useTask';
import { tasksApi } from '../api/tasksApi';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { normalizeApiError } from '../../../core/api/apiError';
import type { TaskStatus } from '../types/task.types';

type TaskDetailsTab = 'overview' | 'lifecycle' | 'linkedProcess' | 'commentsAttachments' | 'domainEvents' | 'changeHistory';

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

export default function TaskDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const taskId = Number(params.id);
  const isValidTaskId = Number.isInteger(taskId) && taskId > 0;
  const [activeTab, setActiveTab] = useState<TaskDetailsTab>('overview');
  const [transitionTarget, setTransitionTarget] = useState<TaskStatus | null>(null);

  const taskQuery = useTask(isValidTaskId ? taskId : null);
  const updateTaskStatusMutation = useUpdateTaskStatus();

  const canViewHistory = auth.user?.role !== ROLES.DRIVER && auth.user?.role !== ROLES.WORKER;
  const canResolveEmployee = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.DISPATCHER;
  const canResolveTransportOrder = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.DISPATCHER || auth.user?.role === ROLES.DRIVER;
  const canResolveStockMovement = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const employeesQuery = useQuery({
    queryKey: queryKeys.tasks.detailEmployee(taskQuery.data?.assignedEmployeeId),
    queryFn: () => employeesApi.getById(Number(taskQuery.data?.assignedEmployeeId)),
    enabled: isValidTaskId && canResolveEmployee && taskQuery.data?.assignedEmployeeId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useQuery({
    queryKey: queryKeys.tasks.detailTransportOrder(taskQuery.data?.transportOrderId),
    queryFn: () => transportOrdersApi.getById(Number(taskQuery.data?.transportOrderId)),
    enabled: isValidTaskId && canResolveTransportOrder && taskQuery.data?.transportOrderId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const stockMovementsQuery = useQuery({
    queryKey: queryKeys.tasks.detailStockMovement(taskQuery.data?.stockMovementId),
    queryFn: () => stockMovementsApi.getById(Number(taskQuery.data?.stockMovementId)),
    enabled: isValidTaskId && canResolveStockMovement && taskQuery.data?.stockMovementId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const allowedTransitionsQuery = useQuery({
    queryKey: ['tasks', taskId, 'status-transitions'],
    queryFn: () => tasksApi.getAllowedStatusTransitions(taskId),
    enabled: isValidTaskId && taskQuery.data != null,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const assignedEmployee = employeesQuery.data ?? null;
  const transportOrder = transportOrdersQuery.data ?? null;
  const stockMovement = stockMovementsQuery.data ?? null;

  useEffect(() => {
    if (!taskQuery.data || ['COMPLETED', 'CANCELLED'].includes(taskQuery.data.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void taskQuery.refetch();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [taskQuery]);

  if (!isValidTaskId) {
    return <ErrorState title="Invalid task" description="The task ID in the route must be a positive integer." />;
  }

  if (taskQuery.isLoading) {
    return (
      <EntityDetailsLayout overline="Operations" title="Task Details" actions={<Button variant="outlined" onClick={() => navigate('/tasks')}>Back to list</Button>}>
        <SectionCard><Typography color="text.secondary">Loading task details...</Typography></SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    const error = normalizeApiError(taskQuery.error, 'The task could not be loaded from the backend.');
    return (
      <EntityDetailsLayout overline="Operations" title="Task Details" actions={<Button variant="outlined" onClick={() => navigate('/tasks')}>Back to list</Button>}>
        <ErrorState
          title={error.status === 403 ? 'Access denied' : error.status === 404 ? 'Task not found' : 'Task could not be loaded'}
          description={error.message}
          details={error.fieldErrors}
          onRetry={() => void taskQuery.refetch()}
        />
      </EntityDetailsLayout>
    );
  }

  const task = taskQuery.data;
  const fallbackAllowedStatuses = getAllowedTaskStatusTransitions(auth.user?.role, task);
  const allowedStatuses = allowedTransitionsQuery.data?.allowedStatuses ?? fallbackAllowedStatuses;
  const statusActions = allowedStatuses.map((status) => ({
    label: status === 'ASSIGNED' ? 'Assign lifecycle state' : status === 'IN_PROGRESS' ? 'Start task' : status === 'BLOCKED' ? 'Block task' : status === 'COMPLETED' ? 'Complete task' : status === 'CANCELLED' ? 'Cancel task' : `Set status to ${status}`,
    status,
  }));

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'linkedProcess', label: 'Linked process' },
    { value: 'commentsAttachments', label: 'Comments & attachments' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history', disabled: !canViewHistory },
  ];

  return (
    <EntityDetailsLayout
      overline="Operations"
      title={task.title}
      description="Review task lifecycle, assignment and linked transport or stock movement context."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as TaskDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={() => navigate('/tasks')}>Back to list</Button>
        </Stack>
      }
    >

      {activeTab === 'overview' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionCard title="Task overview" description="Operational task identity, assignment and due-date state.">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Typography>{task.priority}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <TaskStatusChip status={task.status} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Assigned employee</Typography>
                  {task.assignedEmployeeId ? (
                    <Button component={RouterLink} to={`/employees/${task.assignedEmployeeId}`} size="small" sx={{ px: 0, minWidth: 0 }}>
                      {assignedEmployee ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}` : `Employee #${task.assignedEmployeeId}`}
                    </Button>
                  ) : (
                    <Typography>—</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">{assignedEmployee ? `${assignedEmployee.email} · ${assignedEmployee.position}` : '—'}</Typography>
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
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionCard title="Status actions" description="Allowed transitions follow role and lifecycle guards.">
              {statusActions.length === 0 ? (
                <>
                  <EmptyState title="No status actions" description="This task cannot be moved by your current role or status." />
                  <ForbiddenTransitionHint visible />
                </>
              ) : (
                <Stack spacing={1.5}>
                  {statusActions.map((action) => (
                    <Button
                      key={action.status}
                      variant="contained"
                      disabled={updateTaskStatusMutation.isPending}
                      onClick={() => setTransitionTarget(action.status)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      ) : null}


      {activeTab === 'lifecycle' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <LifecycleHistoryTimeline entityName="TASK" entityId={task.id} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'linkedProcess' ? (
        <SectionCard title="Linked process" description="Connections from this task to transport and inventory execution.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Transport order</Typography>
              <Typography>{transportOrder ? `${transportOrder.orderNumber} (${transportOrder.status})` : task.transportOrderId ?? '—'}</Typography>
              {task.transportOrderId != null ? <Button size="small" variant="outlined" sx={{ mt: 1 }} component={RouterLink} to={`/transport-orders/${task.transportOrderId}`}>Open transport order</Button> : null}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Stock movement</Typography>
              <Typography>{stockMovement ? `${stockMovement.movementType} #${stockMovement.id}` : task.stockMovementId ?? '—'}</Typography>
              {stockMovement ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{stockMovement.productName} · {stockMovement.warehouseName}</Typography> : null}
              {task.stockMovementId != null ? <Button size="small" variant="outlined" sx={{ mt: 1 }} component={RouterLink} to={`/stock-movements/${task.stockMovementId}`}>Open stock movement</Button> : null}
            </Grid>
          </Grid>
        </SectionCard>
      ) : null}

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}><CommentsPanel entityType="TASK" entityId={task.id} allowCreate={auth.user?.role !== ROLES.DRIVER} /></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><AttachmentsPanel entityType="TASK" entityId={task.id} allowCreate={auth.user?.role !== ROLES.DRIVER} /></Grid>
        </Grid>
      ) : null}

      {activeTab === 'domainEvents' ? <DomainEventsPanel entityType="TASK" entityId={task.id} /> : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel entityName="TASK" entityId={task.id} title="Task change history" description="Audit trail for status, assignment and process-link changes made to this task." />
      ) : null}

      <StickyMobileActions
        title="Task quick actions"
        description="Use on phone/tablet while executing work."
        actions={[
          ...statusActions.slice(0, 2).map((action) => ({
            label: action.label,
            onClick: () => setTransitionTarget(action.status),
            disabled: updateTaskStatusMutation.isPending,
          })),
          { label: 'Back', to: '/tasks', variant: 'outlined' as const },
        ]}
      />

      <LifecycleTransitionDialog
        open={transitionTarget != null}
        entityLabel={`task #${task.id}`}
        fromStatus={task.status}
        toStatus={transitionTarget}
        optimisticVersion={task.version}
        loading={updateTaskStatusMutation.isPending}
        onClose={() => setTransitionTarget(null)}
        onConfirm={(reason) => {
          if (!transitionTarget) return;
          updateTaskStatusMutation.mutate(
            { id: task.id, status: transitionTarget, reason, expectedVersion: task.version },
            { onSettled: () => { setTransitionTarget(null); void allowedTransitionsQuery.refetch(); } },
          );
        }}
      />
    </EntityDetailsLayout>
  );
}
