import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import DashboardSummaryStrip from './DashboardSummaryStrip';
import type { OverlordDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: OverlordDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

export default function OverlordDashboardPanel({ data }: Props) {
  const cards = [
    {
      key: 'companies',
      title: 'Companies',
      value: formatNumber(data.companiesTotal),
      subtitle: `${formatNumber(data.activeCompanies)} active`,
      icon: <BusinessRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'users',
      title: 'Users',
      value: formatNumber(data.usersTotal),
      subtitle: `${formatNumber(data.usersByStatus.ACTIVE ?? 0)} active`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'employees',
      title: 'Employees',
      value: formatNumber(data.employeesTotal),
      subtitle: `${formatNumber(data.activeEmployees)} active`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'stockMovements',
      title: 'Stock movements',
      value: formatNumber(data.stockMovementsTotal),
      subtitle: `${formatNumber(data.lowStockRowsTotal)} low-stock rows`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'audit',
      title: 'Audit events',
      value: formatNumber(data.changeHistoryTotal),
      subtitle: `${formatNumber(data.activityLogsTotal)} activity logs`,
      icon: <HistoryRoundedIcon fontSize="small" />,
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

      <DashboardSummaryStrip
        items={[
          { label: 'Active transports', value: formatNumber((data.transportOrdersByStatus.ASSIGNED ?? 0) + (data.transportOrdersByStatus.IN_TRANSIT ?? 0)), tone: 'info' },
          { label: 'Open tasks', value: formatNumber((data.tasksByStatus.NEW ?? 0) + (data.tasksByStatus.IN_PROGRESS ?? 0)), tone: 'warning' },
          { label: 'Low stock rows', value: formatNumber(data.lowStockRowsTotal), tone: data.lowStockRowsTotal > 0 ? 'error' : 'success' },
          { label: 'Available quantity', value: formatNumber(data.inventoryAvailableQuantityTotal), tone: 'success' },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Global operations" description="System-wide transport, task and fleet totals.">
          <Stack spacing={1.25}>
            <Typography variant="body2">
              Transport orders: {formatNumber(data.transportOrdersTotal)}
            </Typography>
            <Typography variant="body2">
              Active transports:{' '}
              {formatNumber(
                (data.transportOrdersByStatus.ASSIGNED ?? 0) +
                  (data.transportOrdersByStatus.IN_TRANSIT ?? 0),
              )}
            </Typography>
            <Typography variant="body2">Tasks: {formatNumber(data.tasksTotal)}</Typography>
            <Typography variant="body2">
              Open tasks:{' '}
              {formatNumber(
                (data.tasksByStatus.NEW ?? 0) +
                  (data.tasksByStatus.IN_PROGRESS ?? 0),
              )}
            </Typography>
            <Typography variant="body2">Vehicles: {formatNumber(data.vehiclesTotal)}</Typography>
            <Typography variant="body2">
              Vehicles in use: {formatNumber(data.vehiclesByStatus.IN_USE ?? 0)}
            </Typography>
          </Stack>
        </SectionCard>

        <SectionCard title="Global inventory" description="System-wide storage and inventory volume.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Warehouses: {formatNumber(data.warehousesTotal)}</Typography>
            <Typography variant="body2">Products: {formatNumber(data.productsTotal)}</Typography>
            <Typography variant="body2">
              Inventory records: {formatNumber(data.inventoryRowsTotal)}
            </Typography>
            <Typography variant="body2">
              Low-stock records: {formatNumber(data.lowStockRowsTotal)}
            </Typography>
            <Typography variant="body2">
              Total quantity: {formatNumber(data.inventoryQuantityTotal)}
            </Typography>
            <Typography variant="body2">
              Available quantity: {formatNumber(data.inventoryAvailableQuantityTotal)}
            </Typography>
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard title="Recent system activity" description="Last audit activity log entries.">
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