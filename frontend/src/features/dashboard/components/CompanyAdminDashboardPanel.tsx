import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import DashboardSummaryStrip from './DashboardSummaryStrip';
import DashboardAlerts from './DashboardAlerts';
import type { CompanyAdminDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: CompanyAdminDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function getOpenTransportCount(data: CompanyAdminDashboardResponse) {
  return (
    (data.transportOrdersByStatus.CREATED ?? 0) +
    (data.transportOrdersByStatus.ASSIGNED ?? 0) +
    (data.transportOrdersByStatus.IN_TRANSIT ?? 0) +
    (data.transportOrdersByStatus.LOADING ?? 0) +
    (data.transportOrdersByStatus.UNLOADING ?? 0)
  );
}

export default function CompanyAdminDashboardPanel({ data }: Props) {
  const navigate = useNavigate();
  const availableVehicles = data.vehiclesByStatus.AVAILABLE ?? 0;
  const vehiclesInUse = data.vehiclesByStatus.IN_USE ?? 0;
  const outOfServiceVehicles = data.vehiclesByStatus.OUT_OF_SERVICE ?? 0;
  const newTasks = data.tasksByStatus.NEW ?? 0;
  const inProgressTasks = data.tasksByStatus.IN_PROGRESS ?? 0;
  const activeTransports = data.activeTransportOrders || getOpenTransportCount(data);

  const cards = [
    {
      key: 'activeTransportOrders',
      title: 'Active transports',
      value: formatNumber(activeTransports),
      subtitle: `${formatNumber(data.transportOrdersTotal)} company transports total`,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'openTasks',
      title: 'Open tasks',
      value: formatNumber(data.openTasksTotal),
      subtitle: `${formatNumber(newTasks)} new · ${formatNumber(inProgressTasks)} in progress`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: data.openTasksTotal > 0 ? 'warning' as const : 'success' as const,
    },
    {
      key: 'lowStock',
      title: 'Low stock',
      value: formatNumber(data.lowStockRowsTotal),
      subtitle: `${formatNumber(data.inventoryRowsTotal)} inventory records watched`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      accent: data.lowStockRowsTotal > 0 ? 'error' as const : 'success' as const,
    },
    {
      key: 'availableVehicles',
      title: 'Available vehicles',
      value: formatNumber(availableVehicles),
      subtitle: `${formatNumber(vehiclesInUse)} in use · ${formatNumber(outOfServiceVehicles)} out of service`,
      icon: <DirectionsCarRoundedIcon fontSize="small" />,
      accent: availableVehicles > 0 ? 'success' as const : 'warning' as const,
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

      <DashboardSummaryStrip
        items={[
          { label: 'Employees', value: `${formatNumber(data.activeEmployees)} active / ${formatNumber(data.employeesTotal)} total`, tone: 'info' },
          { label: 'Warehouses', value: formatNumber(data.warehousesTotal), tone: 'default' },
          { label: 'Products', value: formatNumber(data.productsTotal), tone: 'default' },
          { label: 'Stock movements', value: formatNumber(data.stockMovementsTotal), tone: 'default' },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard
          title="Company command queue"
          description="Only the counters that require company-level attention."
          action={
            <>
              <Button size="small" variant="contained" onClick={() => navigate('/transport-orders')}>
                Open transports
              </Button>
              <Button size="small" variant="outlined" onClick={() => navigate('/tasks')}>
                Open tasks
              </Button>
            </>
          }
        >
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">Assigned transports</Typography>
              <Typography variant="body2" fontWeight={700}>{formatNumber(data.transportOrdersByStatus.ASSIGNED ?? 0)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">In-transit transports</Typography>
              <Typography variant="body2" fontWeight={700}>{formatNumber(data.transportOrdersByStatus.IN_TRANSIT ?? 0)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">Open operational tasks</Typography>
              <Typography variant="body2" fontWeight={700}>{formatNumber(data.openTasksTotal)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">New tasks waiting assignment</Typography>
              <Typography variant="body2" fontWeight={700}>{formatNumber(newTasks)}</Typography>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Company capacity"
          description="People, fleet and stock signals without operational noise."
          action={
            <>
              <Button size="small" variant="contained" onClick={() => navigate('/employees')}>
                Open employees
              </Button>
              <Button size="small" variant="outlined" onClick={() => navigate('/warehouses')}>
                Open warehouses
              </Button>
            </>
          }
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <GroupsRoundedIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">Active employees</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={700}>{formatNumber(data.activeEmployees)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WarehouseRoundedIcon fontSize="small" color="primary" />
                <Typography variant="body2" color="text.secondary">Warehouses</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={700}>{formatNumber(data.warehousesTotal)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Inventory2RoundedIcon fontSize="small" color={data.lowStockRowsTotal > 0 ? 'error' : 'success'} />
                <Typography variant="body2" color="text.secondary">Low-stock records</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={700}>{formatNumber(data.lowStockRowsTotal)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DirectionsCarRoundedIcon fontSize="small" color={outOfServiceVehicles > 0 ? 'warning' : 'success'} />
                <Typography variant="body2" color="text.secondary">Fleet issue count</Typography>
              </Stack>
              <Typography variant="body2" fontWeight={700}>{formatNumber(outOfServiceVehicles)}</Typography>
            </Stack>
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}
