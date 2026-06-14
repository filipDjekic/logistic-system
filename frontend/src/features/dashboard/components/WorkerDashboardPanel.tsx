import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import DashboardAlerts from './DashboardAlerts';
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
    return <Typography variant="body2" color="text.secondary">{emptyText}</Typography>;
  }

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle2">{shift.status}</Typography>
      <Typography variant="body2" color="text.secondary">Start: {formatDate(shift.startTime)}</Typography>
      <Typography variant="body2" color="text.secondary">End: {formatDate(shift.endTime)}</Typography>
      <Typography variant="body2" color="text.secondary">{shift.notes ?? 'No notes'}</Typography>
    </Stack>
  );
}

function renderTask(task: WorkerTaskResponse) {
  return (
    <Box key={task.id} sx={{ p: 1.5, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
      <Typography variant="subtitle2">{task.title} · {task.status} · {task.priority}</Typography>
      <Typography variant="body2" color="text.secondary">
        Due: {formatDate(task.dueDate)}
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
      subtitle: 'Tasks requiring action',
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'todayTasks',
      title: 'Today tasks',
      value: formatNumber(data.todayTasksTotal),
      subtitle: 'Due today',
      icon: <TodayRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'shift',
      title: 'Current shift',
      value: data.currentShift ? data.currentShift.status : '-',
      subtitle: data.currentShift ? 'Active shift' : 'No active shift',
      icon: <ScheduleRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
  ];

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' } }}>
        {cards.map((card) => (
          <StatCard key={card.key} title={card.title} value={card.value} subtitle={card.subtitle} icon={card.icon} accent={card.accent} />
        ))}
      </Box>

      <DashboardAlerts alerts={data.alerts} />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'minmax(0,1fr) minmax(0,1fr)' } }}>
        <SectionCard title="Current shift">
          {renderShift(data.currentShift, 'No active shift.')}
        </SectionCard>

        <SectionCard title="Next shift">
          {renderShift(data.nextShift, 'No upcoming shift.')}
        </SectionCard>
      </Box>

      <SectionCard title="Open tasks">
        <Stack spacing={1.25}>
          {data.openTasks.length === 0
            ? <Typography variant="body2" color="text.secondary">No open tasks.</Typography>
            : data.openTasks.map(renderTask)}
        </Stack>
      </SectionCard>

      <SectionCard title="Today tasks">
        <Stack spacing={1.25}>
          {data.todayTasks.length === 0
            ? <Typography variant="body2" color="text.secondary">No tasks due today.</Typography>
            : data.todayTasks.map(renderTask)}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
