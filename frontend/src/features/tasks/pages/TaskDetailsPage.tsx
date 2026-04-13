import { useMemo } from 'react';
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function TaskDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const taskId = Number(params.id);

  const taskQuery = useTask(Number.isFinite(taskId) ? taskId : null);
  const transportOrdersQuery = useQuery({
    queryKey: ['task-details', 'transport-orders'],
    queryFn: transportOrdersApi.getAll,
    enabled: Number.isFinite(taskId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const stockMovementsQuery = useQuery({
    queryKey: ['task-details', 'stock-movements'],
    queryFn: stockMovementsApi.getAll,
    enabled: Number.isFinite(taskId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrder = useMemo(
    () => (transportOrdersQuery.data ?? []).find((row) => row.id === taskQuery.data?.transportOrderId),
    [taskQuery.data?.transportOrderId, transportOrdersQuery.data],
  );
  const stockMovement = useMemo(
    () => (stockMovementsQuery.data ?? []).find((row) => row.id === taskQuery.data?.stockMovementId),
    [taskQuery.data?.stockMovementId, stockMovementsQuery.data],
  );

  if (!Number.isFinite(taskId)) {
    return <ErrorState title="Invalid task" description="The task ID in the route is not valid." />;
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
          title="Task not found"
          description="The task could not be loaded from the backend."
        />
      </Stack>
    );
  }

  const task = taskQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title={task.title}
        description="Review task details and linked transport or stock movement context."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/change-history?entityName=TASK&entityId=${task.id}`)}
            >
              View history
            </Button>
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
            <TaskStatusChip status={task.status} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Assigned employee ID</Typography>
            <Typography>{task.assignedEmployeeId}</Typography>
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
              {transportOrder ? `${transportOrder.orderNumber} (${transportOrder.status})` : task.transportOrderId ?? '—'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Stock movement</Typography>
            <Typography>
              {stockMovement ? `${stockMovement.movementType} #${stockMovement.id}` : task.stockMovementId ?? '—'}
            </Typography>
          </Grid>
        </Grid>
      </SectionCard>
    </Stack>
  );
}
