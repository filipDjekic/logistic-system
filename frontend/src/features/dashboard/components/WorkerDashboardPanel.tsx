import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import type { WorkerDashboardResponse, WorkerShiftResponse, WorkerTaskResponse } from '../api/dashboardApi';

type Props = {
  data: WorkerDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '-';
}

function renderShift(shift: WorkerShiftResponse | null, emptyText: string) {
  if (!shift) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2">{shift.status}</Typography>
      <Typography variant="body2" color="text.secondary">
        Start: {formatDate(shift.startTime)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        End: {formatDate(shift.endTime)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {shift.notes ?? 'No notes'}
      </Typography>
    </Stack>
  );
}

function renderTask(task: WorkerTaskResponse) {
  return (
    <Box
      key={task.id}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle2">
        {task.title} · {task.status} · {task.priority}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Type: {task.taskType} · Due: {formatDate(task.dueDate)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Warehouse: {task.warehouseName ?? '-'} · Product: {task.productName ?? '-'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Transport: {task.transportOrderNumber ?? '-'} · Stock movement: {task.stockMovementType ?? '-'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {task.description ?? 'No description'}
      </Typography>
    </Box>
  );
}

export default function WorkerDashboardPanel({ data }: Props) {
  const cards = [
    {
      key: 'openTasks',
      title: 'Open tasks',
      value: formatNumber(data.openTasksTotal),
      subtitle: `${formatNumber(data.tasksByStatus.NEW ?? 0)} new, ${formatNumber(data.tasksByStatus.IN_PROGRESS ?? 0)} in progress`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'todayTasks',
      title: 'Today tasks',
      value: formatNumber(data.todayTasksTotal),
      subtitle: 'Tasks due today',
      icon: <TodayRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'loading',
      title: 'Loading tasks',
      value: formatNumber(data.tasksByType.LOADING ?? 0),
      subtitle: `${formatNumber(data.tasksByType.UNLOADING ?? 0)} unloading`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'warehouse',
      title: 'Warehouse tasks',
      value: formatNumber(data.tasksByType.WAREHOUSE ?? 0),
      subtitle: `${formatNumber(data.tasksByType.OTHER ?? 0)} other`,
      icon: <TaskAltRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'shift',
      title: 'Current shift',
      value: data.currentShift ? data.currentShift.status : '-',
      subtitle: data.currentShift ? `${formatDate(data.currentShift.startTime)} → ${formatDate(data.currentShift.endTime)}` : 'No active shift',
      icon: <ScheduleRoundedIcon fontSize="small" />,
      accent: 'error' as const,
    },
  ];

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(5, minmax(0, 1fr))',
          },
        }}
      >
        {cards.map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Current shift" description="Active worker shift right now.">
          {renderShift(data.currentShift, 'No active shift.')}
        </SectionCard>

        <SectionCard title="Next shift" description="Next planned or active future shift.">
          {renderShift(data.nextShift, 'No upcoming shift.')}
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Open tasks" description="Worker tasks with NEW or IN_PROGRESS status.">
          <Stack spacing={1.25}>
            {data.openTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No open tasks.
              </Typography>
            ) : (
              data.openTasks.map(renderTask)
            )}
          </Stack>
        </SectionCard>

        <SectionCard title="Today tasks" description="Worker tasks due today.">
          <Stack spacing={1.25}>
            {data.todayTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks due today.
              </Typography>
            ) : (
              data.todayTasks.map(renderTask)
            )}
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard title="Task type summary" description="Operational task split for this worker.">
        <Stack spacing={1.25}>
          <Typography variant="body2">Loading: {formatNumber(data.tasksByType.LOADING ?? 0)}</Typography>
          <Typography variant="body2">Unloading: {formatNumber(data.tasksByType.UNLOADING ?? 0)}</Typography>
          <Typography variant="body2">Warehouse: {formatNumber(data.tasksByType.WAREHOUSE ?? 0)}</Typography>
          <Typography variant="body2">Transport: {formatNumber(data.tasksByType.TRANSPORT ?? 0)}</Typography>
          <Typography variant="body2">Other: {formatNumber(data.tasksByType.OTHER ?? 0)}</Typography>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
