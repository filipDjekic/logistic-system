import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box } from '@mui/material';
import StatCard from '../../../shared/components/StatCard/StatCrad';

type DashboardStatsGridProps = {
  canSeeTransportOverview: boolean;
  canSeeFleetOverview: boolean;
  canSeeStorageOverview: boolean;
  stats: {
    myTasksOpen: number;
    myTasksCompleted: number;
    unreadNotificationsCount: number;
    transportOrdersTotal: number;
    vehiclesTotal: number;
    inventoryAlertsCount: number;
  };
};

export default function DashboardStatsGrid({
  canSeeTransportOverview,
  canSeeFleetOverview,
  canSeeStorageOverview,
  stats,
}: DashboardStatsGridProps) {
  const items = [
    {
      key: 'openTasks',
      title: 'Open tasks',
      value: stats.myTasksOpen,
      subtitle: 'Tasks in NEW or IN_PROGRESS status',
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'completedTasks',
      title: 'Completed tasks',
      value: stats.myTasksCompleted,
      subtitle: 'Your completed work items',
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'unreadNotifications',
      title: 'Unread notifications',
      value: stats.unreadNotificationsCount,
      subtitle: 'Unread items in your inbox',
      icon: <NotificationsRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    ...(canSeeTransportOverview
      ? [{
          key: 'transportOrders',
          title: 'Transport orders',
          value: stats.transportOrdersTotal,
          subtitle: 'Visible transport orders in your scope',
          icon: <LocalShippingRoundedIcon fontSize="small" />,
          accent: 'primary' as const,
        }]
      : []),
    ...(canSeeFleetOverview
      ? [{
          key: 'vehicles',
          title: 'Vehicles',
          value: stats.vehiclesTotal,
          subtitle: 'Visible fleet vehicles in your scope',
          icon: <DirectionsCarRoundedIcon fontSize="small" />,
          accent: 'info' as const,
        }]
      : []),
    ...(canSeeStorageOverview
      ? [{
          key: 'inventoryAlerts',
          title: 'Low-stock alerts',
          value: stats.inventoryAlertsCount,
          subtitle: 'Inventory rows at or below min stock',
          icon: <WarningAmberRoundedIcon fontSize="small" />,
          accent: 'error' as const,
        }]
      : []),
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          xl: `repeat(${Math.min(Math.max(items.length, 1), 6)}, minmax(0, 1fr))`,
        },
      }}
    >
      {items.map((item) => (
        <StatCard
          key={item.key}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          accent={item.accent}
        />
      ))}
    </Box>
  );
}