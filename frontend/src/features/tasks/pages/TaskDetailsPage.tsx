import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getAllowedTaskStatusTransitions } from '../../../core/permissions/operationGuards';
import { DetailsLifecycleCard, EntityDetailsLayout, OperationalDetailsTabPanels, buildOperationalTabs } from '../../../shared/components/EntityDetails';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { StickyMobileActions } from '../../../shared/components/Mobile';
import { ForbiddenTransitionHint, LifecycleTransitionDialog } from '../../../shared/components/Lifecycle';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import { employeesApi } from '../../employees/api/employeesApi';
import TaskStatusChip from '../components/TaskStatusChip';
import { useTask } from '../hooks/useTask';
import { tasksApi } from '../api/tasksApi';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { normalizeApiError } from '../../../core/api/apiError';
import type { TaskStatus } from '../types/task.types';

type TaskDetailsTab = 'overview' | 'lifecycle' | 'linkedProcess' | 'attachments' | 'comments' | 'audit' | 'history';

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
      <EntityDetailsLayout overline="Operations" title="Task Details" actionItems={[{ key: 'back', label: 'Back to list', to: '/tasks' }]}>
        <SectionCard><Typography color="text.secondary">Loading task details...</Typography></SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    const error = normalizeApiError(taskQuery.error, 'The task could not be loaded from the backend.');
    return (
      <EntityDetailsLayout overline="Operations" title="Task Details" actionItems={[{ key: 'back', label: 'Back to list', to: '/tasks' }]}>
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
  const taskLifecycleStatuses: TaskStatus[] = task.status === 'CANCELLED'
    ? ['NEW', 'OPEN', 'CANCELLED']
    : ['NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];

  const statusActions = allowedStatuses.map((status) => ({
    label: status === 'ASSIGNED' ? 'Assign lifecycle state' : status === 'IN_PROGRESS' ? 'Start task' : status === 'BLOCKED' ? 'Block task' : status === 'COMPLETED' ? 'Complete task' : status === 'CANCELLED' ? 'Cancel task' : `Set status to ${status}`,
    status,
  }));

  const lifecycleActionItems = statusActions.map((action) => ({
    key: action.status,
    label: action.label,
    variant: 'contained' as const,
    disabled: updateTaskStatusMutation.isPending,
    onClick: () => setTransitionTarget(action.status),
  }));

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'linkedProcess', label: 'Linked process' },
    ...buildOperationalTabs({ entityType: 'TASK', entityName: 'TASK', entityId: task.id, allowCreateAttachments: auth.user?.role !== ROLES.DRIVER, allowCreateComments: auth.user?.role !== ROLES.DRIVER, canViewAudit: canViewHistory }),
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
            <DetailsLifecycleCard
              title="Status actions"
              description="Allowed transitions follow role and lifecycle guards."
              currentStatus={task.status}
              statusNode={<TaskStatusChip status={task.status} />}
              statuses={taskLifecycleStatuses}
              allowedNextStatuses={allowedStatuses}
              terminalStatuses={['COMPLETED', 'CANCELLED']}
              actions={lifecycleActionItems}
              noActionsText="This task cannot be moved by your current role or status."
            >
              {statusActions.length === 0 ? <ForbiddenTransitionHint visible /> : null}
            </DetailsLifecycleCard>
          </Grid>
        </Grid>
      ) : null}


      {activeTab === 'lifecycle' ? (
        <DetailsLifecycleCard
          currentStatus={task.status}
          statusNode={<TaskStatusChip status={task.status} />}
          statuses={taskLifecycleStatuses}
          allowedNextStatuses={allowedStatuses}
          terminalStatuses={['COMPLETED', 'CANCELLED']}
          actions={lifecycleActionItems}
          historyEntityName="TASK"
          historyEntityId={task.id}
        >
          {statusActions.length === 0 ? <ForbiddenTransitionHint visible /> : null}
        </DetailsLifecycleCard>
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

      <OperationalDetailsTabPanels
        activeTab={activeTab}
        entityType="TASK"
        entityName="TASK"
        entityId={task.id}
        allowCreateAttachments={auth.user?.role !== ROLES.DRIVER}
        allowCreateComments={auth.user?.role !== ROLES.DRIVER}
        canViewAudit={canViewHistory}
        auditUnavailableTitle="Audit unavailable"
        auditUnavailableDescription="Your role cannot view task audit data."
      />

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
