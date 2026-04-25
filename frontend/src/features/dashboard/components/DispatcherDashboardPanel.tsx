import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import type { DispatcherDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: DispatcherDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '-';
}

export default function DispatcherDashboardPanel({ data }: Props) {
  const cards = [
    {
      key: 'activeTransportOrders',
      title: 'Active transports',
      value: formatNumber(data.activeTransportOrders),
      subtitle: `${formatNumber(data.transportOrdersTotal)} total`,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'unassignedTransportOrders',
      title: 'Unassigned transports',
      value: formatNumber(data.unassignedTransportOrders),
      subtitle: 'Missing driver or vehicle',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      accent: 'warning' as const,
    },
    {
      key: 'vehicles',
      title: 'Available vehicles',
      value: formatNumber(data.availableVehicles),
      subtitle: `${formatNumber(data.vehiclesInUse)} in use`,
      icon: <DirectionsCarRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'drivers',
      title: 'Available drivers',
      value: formatNumber(data.availableDrivers),
      subtitle: `${formatNumber(data.busyDrivers)} busy`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      accent: 'success' as const,
    },
    {
      key: 'tasks',
      title: 'Open dispatcher tasks',
      value: formatNumber(data.openDispatcherTasksTotal),
      subtitle: `${formatNumber(data.dispatcherTasksTotal)} total`,
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

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Transport planning" description="Transport statuses and dispatch workload.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Created: {formatNumber(data.transportOrdersByStatus.CREATED ?? 0)}</Typography>
            <Typography variant="body2">Assigned: {formatNumber(data.transportOrdersByStatus.ASSIGNED ?? 0)}</Typography>
            <Typography variant="body2">In transit: {formatNumber(data.transportOrdersByStatus.IN_TRANSIT ?? 0)}</Typography>
            <Typography variant="body2">Delivered: {formatNumber(data.transportOrdersByStatus.DELIVERED ?? 0)}</Typography>
            <Typography variant="body2">Cancelled: {formatNumber(data.transportOrdersByStatus.CANCELLED ?? 0)}</Typography>
            <Typography variant="body2">New tasks: {formatNumber(data.dispatcherTasksByStatus.NEW ?? 0)}</Typography>
            <Typography variant="body2">In-progress tasks: {formatNumber(data.dispatcherTasksByStatus.IN_PROGRESS ?? 0)}</Typography>
          </Stack>
        </SectionCard>

        <SectionCard title="Fleet and drivers" description="Available execution resources for dispatching.">
          <Stack spacing={1.25}>
            <Typography variant="body2">Vehicles total: {formatNumber(data.vehiclesTotal)}</Typography>
            <Typography variant="body2">Available vehicles: {formatNumber(data.vehiclesByStatus.AVAILABLE ?? 0)}</Typography>
            <Typography variant="body2">Vehicles in use: {formatNumber(data.vehiclesByStatus.IN_USE ?? 0)}</Typography>
            <Typography variant="body2">Vehicles in maintenance: {formatNumber(data.vehiclesByStatus.MAINTENANCE ?? 0)}</Typography>
            <Typography variant="body2">Drivers total: {formatNumber(data.driversTotal)}</Typography>
            <Typography variant="body2">Active drivers: {formatNumber(data.activeDrivers)}</Typography>
            <Typography variant="body2">Busy drivers: {formatNumber(data.busyDrivers)}</Typography>
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.2fr) minmax(0, 0.8fr)' },
        }}
      >
        <SectionCard title="Recent transport orders" description="Newest company transport orders.">
          <Stack spacing={1.25}>
            {data.recentTransportOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transport orders.
              </Typography>
            ) : (
              data.recentTransportOrders.map((order) => (
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
                    {order.sourceWarehouseName ?? '-'} → {order.destinationWarehouseName ?? '-'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Vehicle: {order.vehicleRegistrationNumber ?? '-'} · Driver: {order.assignedEmployeeName ?? '-'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Departure: {formatDate(order.departureTime)} · Planned arrival: {formatDate(order.plannedArrivalTime)}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>

        <Stack spacing={2}>
          <SectionCard title="Available vehicles" description="First available vehicle candidates.">
            <Stack spacing={1.25}>
              {data.availableVehicleCandidates.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No available vehicles.
                </Typography>
              ) : (
                data.availableVehicleCandidates.map((vehicle) => (
                  <Box key={vehicle.id}>
                    <Typography variant="subtitle2">{vehicle.registrationNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.brand} {vehicle.model} · {vehicle.type} · capacity {formatNumber(vehicle.capacity)}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </SectionCard>

          <SectionCard title="Available drivers" description="Active drivers without active transport.">
            <Stack spacing={1.25}>
              {data.availableDriverCandidates.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No available drivers.
                </Typography>
              ) : (
                data.availableDriverCandidates.map((driver) => (
                  <Box key={driver.id}>
                    <Typography variant="subtitle2">
                      {driver.firstName} {driver.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {driver.email} · {driver.phoneNumber}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}
