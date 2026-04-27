import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import DashboardSummaryStrip from './DashboardSummaryStrip';
import type { DriverDashboardResponse, DriverTransportOrderResponse } from '../api/dashboardApi';

type Props = {
  data: DriverDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '-';
}

function transportRoute(order: DriverTransportOrderResponse) {
  return `${order.sourceWarehouseName ?? '-'} → ${order.destinationWarehouseName ?? '-'}`;
}

export default function DriverDashboardPanel({ data }: Props) {
  const nextTransport = data.nextTransportOrder;

  const cards = [
    {
      key: 'activeTransportOrders',
      title: 'Active transports',
      value: formatNumber(data.activeTransportOrders),
      subtitle: `${formatNumber(data.assignedTransportOrdersTotal)} assigned total`,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'nextTransport',
      title: 'Next transport',
      value: nextTransport?.orderNumber ?? '-',
      subtitle: nextTransport ? nextTransport.status : 'No active transport',
      icon: <ScheduleRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'transportStatus',
      title: 'In transit',
      value: formatNumber(data.transportOrdersByStatus.IN_TRANSIT ?? 0),
      subtitle: `${formatNumber(data.transportOrdersByStatus.ASSIGNED ?? 0)} assigned`,
      icon: <TimelineRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'openTasks',
      title: 'Open transport tasks',
      value: formatNumber(data.openTransportTasksTotal),
      subtitle: `${formatNumber(data.transportTasksTotal)} transport tasks`,
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'vehicle',
      title: 'Vehicle',
      value: nextTransport?.vehicleRegistrationNumber ?? '-',
      subtitle: nextTransport ? `${nextTransport.vehicleBrand ?? ''} ${nextTransport.vehicleModel ?? ''}`.trim() || '-' : 'No active vehicle',
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

      <DashboardSummaryStrip
        items={[
          { label: 'Active transports', value: formatNumber(data.activeTransportOrders), tone: 'info' },
          { label: 'Open transport tasks', value: formatNumber(data.openTransportTasksTotal), tone: 'warning' },
          { label: 'Assigned transports', value: formatNumber(data.assignedTransportOrdersTotal), tone: 'success' },
          { label: 'Next transport', value: data.nextTransportOrder?.orderNumber ?? '-', tone: data.nextTransportOrder ? 'info' : 'default' },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Next transport" description="Closest active transport assigned to this driver.">
          {nextTransport ? (
            <Stack spacing={1.25}>
              <Typography variant="subtitle2">
                {nextTransport.orderNumber} · {nextTransport.status} · {nextTransport.priority}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transportRoute(nextTransport)}
              </Typography>
              <Typography variant="body2">
                Vehicle: {nextTransport.vehicleRegistrationNumber ?? '-'} · Weight: {formatNumber(nextTransport.totalWeight)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Departure: {formatDate(nextTransport.departureTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Planned arrival: {formatDate(nextTransport.plannedArrivalTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {nextTransport.description ?? 'No description'}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No active transport assigned.
            </Typography>
          )}
        </SectionCard>

        <SectionCard title="Transport status" description="Driver transport counts by status.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Created: {formatNumber(data.transportOrdersByStatus.CREATED ?? 0)}</Typography>
            <Typography variant="body2">Assigned: {formatNumber(data.transportOrdersByStatus.ASSIGNED ?? 0)}</Typography>
            <Typography variant="body2">In transit: {formatNumber(data.transportOrdersByStatus.IN_TRANSIT ?? 0)}</Typography>
            <Typography variant="body2">Delivered: {formatNumber(data.transportOrdersByStatus.DELIVERED ?? 0)}</Typography>
            <Typography variant="body2">Cancelled: {formatNumber(data.transportOrdersByStatus.CANCELLED ?? 0)}</Typography>
            <Typography variant="body2">New tasks: {formatNumber(data.transportTasksByStatus.NEW ?? 0)}</Typography>
            <Typography variant="body2">In-progress tasks: {formatNumber(data.transportTasksByStatus.IN_PROGRESS ?? 0)}</Typography>
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
        <SectionCard title="Active transports" description="Current transports assigned to this driver.">
          <Stack spacing={1.25}>
            {data.activeTransportOrderList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No active transports.
              </Typography>
            ) : (
              data.activeTransportOrderList.map((order) => (
                <Box
                  key={order.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2">
                    {order.orderNumber} · {order.status} · {order.priority}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {transportRoute(order)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Departure: {formatDate(order.departureTime)} · Planned arrival: {formatDate(order.plannedArrivalTime)}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>

        <SectionCard title="Transport tasks" description="Tasks connected to assigned transports.">
          <Stack spacing={1.25}>
            {data.transportTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transport tasks.
              </Typography>
            ) : (
              data.transportTasks.map((task) => (
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
                    Transport: {task.transportOrderNumber ?? '-'} · {task.transportOrderStatus ?? '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {task.description ?? 'No description'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due: {formatDate(task.dueDate)}
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
