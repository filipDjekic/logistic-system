import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import type { CompanyAdminDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: CompanyAdminDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

export default function CompanyAdminDashboardPanel({ data }: Props) {
  const completedTasks = data.tasksByStatus.COMPLETED ?? 0;

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
      key: 'activeTransportOrders',
      title: 'Active transports',
      value: formatNumber(data.activeTransportOrders),
      subtitle: `${formatNumber(data.transportOrdersTotal)} total`,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'tasks',
      title: 'Open tasks',
      value: formatNumber(data.openTasksTotal),
      subtitle: `${formatNumber(completedTasks)} completed`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'inventory',
      title: 'Inventory rows',
      value: formatNumber(data.inventoryRowsTotal),
      subtitle: `${formatNumber(data.lowStockRowsTotal)} critical`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'vehicles',
      title: 'Vehicles',
      value: formatNumber(data.vehiclesTotal),
      subtitle: `${formatNumber(data.vehiclesByStatus.AVAILABLE ?? 0)} available`,
      icon: <DirectionsCarRoundedIcon fontSize="small" />,
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
        <SectionCard title="Company operations" description="Transport, task and fleet overview for this company.">
          <Stack spacing={1.25}>
            <Typography variant="body2">
              Transport orders: {formatNumber(data.transportOrdersTotal)}
            </Typography>
            <Typography variant="body2">
              Created: {formatNumber(data.transportOrdersByStatus.CREATED ?? 0)}
            </Typography>
            <Typography variant="body2">
              Assigned: {formatNumber(data.transportOrdersByStatus.ASSIGNED ?? 0)}
            </Typography>
            <Typography variant="body2">
              In transit: {formatNumber(data.transportOrdersByStatus.IN_TRANSIT ?? 0)}
            </Typography>
            <Typography variant="body2">
              Delivered: {formatNumber(data.transportOrdersByStatus.DELIVERED ?? 0)}
            </Typography>
            <Typography variant="body2">Tasks: {formatNumber(data.tasksTotal)}</Typography>
            <Typography variant="body2">New tasks: {formatNumber(data.tasksByStatus.NEW ?? 0)}</Typography>
            <Typography variant="body2">
              In-progress tasks: {formatNumber(data.tasksByStatus.IN_PROGRESS ?? 0)}
            </Typography>
          </Stack>
        </SectionCard>

        <SectionCard title="Company resources" description="Storage, stock and vehicle status for this company.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Warehouses: {formatNumber(data.warehousesTotal)}</Typography>
            <Typography variant="body2">Products: {formatNumber(data.productsTotal)}</Typography>
            <Typography variant="body2">
              Total quantity: {formatNumber(data.inventoryQuantityTotal)}
            </Typography>
            <Typography variant="body2">
              Available quantity: {formatNumber(data.inventoryAvailableQuantityTotal)}
            </Typography>
            <Typography variant="body2">
              Low-stock records: {formatNumber(data.lowStockRowsTotal)}
            </Typography>
            <Typography variant="body2">
              Vehicles available: {formatNumber(data.vehiclesByStatus.AVAILABLE ?? 0)}
            </Typography>
            <Typography variant="body2">
              Vehicles in use: {formatNumber(data.vehiclesByStatus.IN_USE ?? 0)}
            </Typography>
            <Typography variant="body2">
              Vehicles out of service: {formatNumber(data.vehiclesByStatus.OUT_OF_SERVICE ?? 0)}
            </Typography>
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard title="Recent company activity" description="Last activity log entries for this company.">
        <Stack spacing={1.25}>
          {data.recentActivities.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No recent activity.
            </Typography>
          ) : (
            data.recentActivities.map((activity) => (
              <Box
                key={activity.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="subtitle2">
                  {activity.action} · {activity.entityName} #{activity.entityId ?? '-'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {activity.description ?? activity.entityIdentifier ?? 'No description'}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {activity.userEmail ?? 'system'} · {new Date(activity.createdAt).toLocaleString()}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
