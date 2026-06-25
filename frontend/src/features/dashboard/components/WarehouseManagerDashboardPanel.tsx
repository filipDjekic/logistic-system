import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import DashboardAlerts from './DashboardAlerts';
import DashboardSummaryStrip from './DashboardSummaryStrip';
import type { WarehouseManagerDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: WarehouseManagerDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function taskCount(statuses: Record<string, number>, ...keys: string[]) {
  return keys.reduce((total, key) => total + Number(statuses[key] ?? 0), 0);
}

export default function WarehouseManagerDashboardPanel({ data }: Props) {
  const navigate = useNavigate();
  const newTasks = taskCount(data.warehouseTasksByStatus, 'NEW');
  const inProgressTasks = taskCount(data.warehouseTasksByStatus, 'IN_PROGRESS');
  const actionableTasks = newTasks + inProgressTasks;

  const cards = [
    {
      key: 'lowStock',
      title: 'Low stock',
      value: formatNumber(data.lowStockRowsTotal),
      subtitle: data.lowStockRowsTotal > 0 ? 'Needs replenishment review' : 'No stock risk detected',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      accent: data.lowStockRowsTotal > 0 ? ('error' as const) : ('success' as const),
    },
    {
      key: 'openTasks',
      title: 'Open warehouse tasks',
      value: formatNumber(data.openWarehouseTasksTotal),
      subtitle: `${formatNumber(actionableTasks)} actionable now`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'stockAvailability',
      title: 'Available stock',
      value: formatNumber(data.inventoryAvailableQuantityTotal),
      subtitle: `${formatNumber(data.inventoryReservedQuantityTotal)} reserved`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'inventoryValue',
      title: 'Inventory value',
      value: formatNumber(data.inventoryValueTotal),
      subtitle: `${data.inventoryValuationCurrency ?? 'No currency'} · avg ${formatNumber(data.inventoryAverageUnitCost)}`,
      icon: <PaidRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'activeTransports',
      title: 'Inbound/outbound transports',
      value: formatNumber(data.activeTransportOrdersAffectingWarehouses),
      subtitle: 'Affecting managed warehouses',
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
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
          { label: 'Managed warehouses', value: formatNumber(data.managedWarehousesTotal), tone: 'info' },
          { label: 'Inventory rows', value: formatNumber(data.inventoryRowsTotal), tone: 'default' },
          { label: 'Inventory value', value: formatNumber(data.inventoryValueTotal), tone: 'success' },
          { label: 'Recent movements', value: formatNumber(data.recentStockMovements.length), tone: 'success' },
          { label: 'Open tasks', value: formatNumber(data.openWarehouseTasksTotal), tone: data.openWarehouseTasksTotal > 0 ? 'warning' : 'success' },
        ]}
      />

      <DashboardAlerts alerts={data.alerts} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' },
        }}
      >
        <SectionCard
          title="Stock risks"
          description="Products that need immediate warehouse manager attention."
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/inventory')}>
              Open inventory
            </Button>
          }
        >
          <Stack spacing={1.25}>
            {data.lowStockItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No low-stock items in managed warehouses.
              </Typography>
            ) : (
              data.lowStockItems.slice(0, 6).map((item) => (
                <Box
                  key={`${item.warehouseId}-${item.productId}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/inventory/${item.warehouseId}/${item.productId}`)}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.warehouseName}
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      color="warning"
                      label={`Available ${formatNumber(item.availableQuantity)} / min ${formatNumber(item.minStockLevel)}`}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Quantity: {formatNumber(item.quantity)} · Reserved: {formatNumber(item.reservedQuantity)}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Warehouse workload"
          description="Only task statuses that require operational follow-up."
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/tasks')}>
              Open tasks
            </Button>
          }
        >
          <Stack spacing={1.25}>
            <Box sx={{ p: 1.5, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2">Needs assignment or start</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {formatNumber(newTasks)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New warehouse tasks waiting for action.
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2">In progress</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {formatNumber(inProgressTasks)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active execution load in managed warehouses.
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total warehouse tasks: {formatNumber(data.warehouseTasksTotal)} · Open:{' '}
              {formatNumber(data.openWarehouseTasksTotal)}
            </Typography>
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
        <SectionCard
          title="Managed warehouse health"
          description="Compact stock summary per warehouse."
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/warehouses')}>
              Open warehouses
            </Button>
          }
        >
          <Stack spacing={1.25}>
            {data.warehouseInventorySummaries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No managed warehouse inventory.
              </Typography>
            ) : (
              data.warehouseInventorySummaries.slice(0, 5).map((warehouse) => (
                <Box
                  key={warehouse.warehouseId}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/inventory?warehouseId=${warehouse.warehouseId}`)}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                      {warehouse.warehouseName}
                    </Typography>
                    <Chip
                      size="small"
                      color={warehouse.lowStockRowsTotal > 0 ? 'warning' : 'success'}
                      label={`${formatNumber(warehouse.lowStockRowsTotal)} low stock`}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Rows: {formatNumber(warehouse.inventoryRowsTotal)} · Available:{' '}
                    {formatNumber(warehouse.availableQuantityTotal)} · Reserved:{' '}
                    {formatNumber(warehouse.reservedQuantityTotal)} · Value: {formatNumber(warehouse.totalValue)}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Recent stock movements"
          description="Latest warehouse stock changes for tracing and verification."
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/stock-movements')}>
              Open movements
            </Button>
          }
        >
          <Stack spacing={1.25}>
            {data.recentStockMovements.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent stock movements.
              </Typography>
            ) : (
              data.recentStockMovements.slice(0, 6).map((movement) => (
                <Box
                  key={movement.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/stock-movements/${movement.id}`)}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
                    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {movement.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {movement.warehouseName} · {movement.reasonCode}
                      </Typography>
                    </Stack>
                    <Chip size="small" label={`${movement.movementType} · ${formatNumber(movement.quantity)}`} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(movement.createdAt)} · {movement.referenceNumber ?? 'No reference'}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}
