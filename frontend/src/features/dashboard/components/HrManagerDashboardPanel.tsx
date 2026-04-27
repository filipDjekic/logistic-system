import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import DashboardSummaryStrip from './DashboardSummaryStrip';
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
      key: 'newEmployees',
      title: 'New employees',
      value: formatNumber(data.newEmployeesLast30Days),
      subtitle: 'last 30 days',
      icon: <WorkRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'inactiveEmployees',
      title: 'Inactive employees',
      value: formatNumber(data.deactivatedEmployees),
      subtitle: 'deactivated records',
      icon: <PersonOffRoundedIcon fontSize="small" />,
      accent: 'error' as const,
    },
    {
      key: 'shifts',
      title: 'Active shifts',
      value: formatNumber(data.activeShifts),
      subtitle: `${formatNumber(data.plannedShifts)} planned`,
      icon: <EventAvailableRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'hrTasks',
      title: 'HR tasks',
      value: formatNumber(data.hrTasksTotal),
      subtitle: `${formatNumber(openHrTasks)} open`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
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

      <DashboardSummaryStrip
        items={[
          { label: 'Active employees', value: formatNumber(data.activeEmployees), tone: 'success' },
          { label: 'Planned shifts', value: formatNumber(data.plannedShifts), tone: 'info' },
          { label: 'Without shift', value: formatNumber(data.employeesWithoutActiveOrPlannedShift), tone: data.employeesWithoutActiveOrPlannedShift > 0 ? 'warning' : 'success' },
          { label: 'New employees 30d', value: formatNumber(data.newEmployeesLast30Days), tone: 'info' },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Employees by position" description="Current company employee distribution.">
          <Stack spacing={1.25}>
            {Object.entries(data.employeesByPosition).map(([position, count]) => (
              <Typography key={position} variant="body2">
                {position}: {formatNumber(count)}
              </Typography>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="Shift coverage" description="Current HR coverage indicators.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Active shifts: {formatNumber(data.activeShifts)}</Typography>
            <Typography variant="body2">Planned shifts: {formatNumber(data.plannedShifts)}</Typography>
            <Typography variant="body2">
              Employees without active or planned shift:{' '}
              {formatNumber(data.employeesWithoutActiveOrPlannedShift)}
            </Typography>
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard title="HR task status" description="Tasks assigned to HR managers in this company.">
        <Stack spacing={1.25}>
          {Object.entries(data.hrTasksByStatus).map(([status, count]) => (
            <Typography key={status} variant="body2">
              {status}: {formatNumber(count)}
            </Typography>
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
