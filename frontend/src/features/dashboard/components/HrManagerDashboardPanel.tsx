import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import DashboardAlerts from './DashboardAlerts';
import type { HrManagerDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: HrManagerDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

export default function HrManagerDashboardPanel({ data }: Props) {
  const openHrTasks = (data.hrTasksByStatus.NEW ?? 0) + (data.hrTasksByStatus.IN_PROGRESS ?? 0);

  const cards = [
    {
      key: 'employees',
      title: 'Employees',
      value: formatNumber(data.employeesTotal),
      subtitle: `${formatNumber(data.activeEmployees)} active`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'withoutShift',
      title: 'Without shift',
      value: formatNumber(data.employeesWithoutActiveOrPlannedShift),
      subtitle: 'Need schedule coverage',
      icon: <EventAvailableRoundedIcon fontSize="small" />,
      accent: data.employeesWithoutActiveOrPlannedShift > 0 ? 'warning' as const : 'success' as const,
    },
    {
      key: 'activeShifts',
      title: 'Active shifts',
      value: formatNumber(data.activeShifts),
      subtitle: `${formatNumber(data.plannedShifts)} planned`,
      icon: <EventAvailableRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'hrTasks',
      title: 'Open HR tasks',
      value: formatNumber(openHrTasks),
      subtitle: `${formatNumber(data.hrTasksTotal)} total`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: openHrTasks > 0 ? 'warning' as const : 'success' as const,
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
            xl: 'repeat(4, minmax(0, 1fr))',
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

      <DashboardAlerts alerts={data.alerts} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Shift coverage" description="Employees that need scheduling attention.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Active shifts: {formatNumber(data.activeShifts)}</Typography>
            <Typography variant="body2">Planned shifts: {formatNumber(data.plannedShifts)}</Typography>
            <Typography variant="body2">
              Employees without active or planned shift:{' '}
              {formatNumber(data.employeesWithoutActiveOrPlannedShift)}
            </Typography>
          </Stack>
        </SectionCard>

        <SectionCard title="Employee status" description="Current company employee state.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Active employees: {formatNumber(data.activeEmployees)}</Typography>
            <Typography variant="body2">Inactive employees: {formatNumber(data.inactiveEmployees)}</Typography>
            <Typography variant="body2">New employees last 30 days: {formatNumber(data.newEmployeesLast30Days)}</Typography>
            <Typography variant="body2">Deactivated records: {formatNumber(data.deactivatedEmployees)}</Typography>
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="HR task status" description="Only task counts HR needs for daily work.">
          <Stack spacing={1.25}>
            {Object.keys(data.hrTasksByStatus).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No HR tasks.</Typography>
            ) : (
              Object.entries(data.hrTasksByStatus).map(([status, count]) => (
                <Typography key={status} variant="body2">
                  {status}: {formatNumber(count)}
                </Typography>
              ))
            )}
          </Stack>
        </SectionCard>

        <SectionCard title="Employees by position" description="Compact HR distribution view.">
          <Stack spacing={1.25}>
            {Object.keys(data.employeesByPosition).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No position data.</Typography>
            ) : (
              Object.entries(data.employeesByPosition).map(([position, count]) => (
                <Typography key={position} variant="body2">
                  {position}: {formatNumber(count)}
                </Typography>
              ))
            )}
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}
