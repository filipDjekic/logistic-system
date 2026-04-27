import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import DashboardSummaryStrip from './DashboardSummaryStrip';
import type { WarehouseManagerDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: WarehouseManagerDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

export default function WarehouseManagerDashboardPanel({ data }: Props) {
  const cards = [
    {
      key: 'warehouses',
      title: 'Managed warehouses',
      value: formatNumber(data.managedWarehousesTotal),
      subtitle: `${formatNumber(data.inventoryRowsTotal)} inventory rows`,
      icon: <WarehouseRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'inventory',
      title: 'Available stock',
      value: formatNumber(data.inventoryAvailableQuantityTotal),
      subtitle: `${formatNumber(data.inventoryReservedQuantityTotal)} reserved`,
      icon: <Inventory2RoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'lowStock',
      title: 'Low stock',
      value: formatNumber(data.lowStockRowsTotal),
      subtitle: 'Rows at or below minimum',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'transports',
      title: 'Active transports',
      value: formatNumber(data.activeTransportOrdersAffectingWarehouses),
      subtitle: 'Affecting managed warehouses',
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'tasks',
      title: 'Open tasks',
      value: formatNumber(data.openWarehouseTasksTotal),
      subtitle: `${formatNumber(data.warehouseTasksTotal)} warehouse tasks`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
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
          { label: 'Managed warehouses', value: formatNumber(data.managedWarehousesTotal), tone: 'info' },
          { label: 'Available quantity', value: formatNumber(data.inventoryAvailableQuantityTotal), tone: 'success' },
          { label: 'Low stock rows', value: formatNumber(data.lowStockRowsTotal), tone: data.lowStockRowsTotal > 0 ? 'error' : 'success' },
          { label: 'Open warehouse tasks', value: formatNumber(data.openWarehouseTasksTotal), tone: 'warning' },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Inventory by warehouse" description="Current stock state for managed warehouses.">
          <Stack spacing={1.25}>
            {data.warehouseInventorySummaries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No managed warehouse inventory.
              </Typography>
            ) : (
              data.warehouseInventorySummaries.map((warehouse) => (
                <Box
                  key={warehouse.warehouseId}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2">{warehouse.warehouseName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rows: {formatNumber(warehouse.inventoryRowsTotal)} · Low stock:{' '}
                    {formatNumber(warehouse.lowStockRowsTotal)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {formatNumber(warehouse.quantityTotal)} · Reserved:{' '}
                    {formatNumber(warehouse.reservedQuantityTotal)} · Available:{' '}
                    {formatNumber(warehouse.availableQuantityTotal)}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>

        <SectionCard title="Low stock list" description="Products at or below minimum stock level.">
          <Stack spacing={1.25}>
            {data.lowStockItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No low-stock items.
              </Typography>
            ) : (
              data.lowStockItems.map((item) => (
                <Box
                  key={`${item.warehouseId}-${item.productId}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2">{item.productName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.warehouseName} · Available: {formatNumber(item.availableQuantity)} · Minimum:{' '}
                    {formatNumber(item.minStockLevel)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {formatNumber(item.quantity)} · Reserved: {formatNumber(item.reservedQuantity)}
                  </Typography>
                </Box>
              ))
            )}
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
        <SectionCard title="Warehouse tasks" description="Operational tasks connected to managed warehouses.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Total tasks: {formatNumber(data.warehouseTasksTotal)}</Typography>
            <Typography variant="body2">Open tasks: {formatNumber(data.openWarehouseTasksTotal)}</Typography>
            <Typography variant="body2">New: {formatNumber(data.warehouseTasksByStatus.NEW ?? 0)}</Typography>
            <Typography variant="body2">
              In progress: {formatNumber(data.warehouseTasksByStatus.IN_PROGRESS ?? 0)}
            </Typography>
            <Typography variant="body2">
              Completed: {formatNumber(data.warehouseTasksByStatus.COMPLETED ?? 0)}
            </Typography>
            <Typography variant="body2">
              Cancelled: {formatNumber(data.warehouseTasksByStatus.CANCELLED ?? 0)}
            </Typography>
          </Stack>
        </SectionCard>

        <SectionCard title="Recent stock movements" description="Latest movements in managed warehouses.">
          <Stack spacing={1.25}>
            {data.recentStockMovements.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent stock movements.
              </Typography>
            ) : (
              data.recentStockMovements.map((movement) => (
                <Box
                  key={movement.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2">
                    {movement.movementType} · {movement.productName} · {formatNumber(movement.quantity)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {movement.warehouseName} · {movement.reasonCode} · {movement.referenceNumber ?? 'No reference'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(movement.createdAt).toLocaleString()}
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
