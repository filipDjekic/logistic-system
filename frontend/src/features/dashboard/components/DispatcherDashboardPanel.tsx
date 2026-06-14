import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import DashboardAlerts from './DashboardAlerts';
import DashboardListItem from './DashboardListItem';
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

function formatRoute(source: string | null | undefined, destination: string | null | undefined) {
  return `${source ?? '-'} → ${destination ?? '-'}`;
}

export default function DispatcherDashboardPanel({ data }: Props) {
  const cards = [
    {
      key: 'unassignedTransportOrders',
      title: 'Unassigned transports',
      value: formatNumber(data.unassignedTransportOrders),
      subtitle: 'Needs driver or vehicle assignment',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      accent: data.unassignedTransportOrders > 0 ? ('warning' as const) : ('success' as const),
    },
    {
      key: 'activeTransportOrders',
      title: 'Active transports',
      value: formatNumber(data.activeTransportOrders),
      subtitle: `${formatNumber(data.transportOrdersTotal)} total transports`,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'availableVehicles',
      title: 'Available vehicles',
      value: formatNumber(data.availableVehicles),
      subtitle: `${formatNumber(data.vehiclesInUse)} currently in use`,
      icon: <DirectionsCarRoundedIcon fontSize="small" />,
      accent: data.availableVehicles > 0 ? ('success' as const) : ('warning' as const),
    },
    {
      key: 'availableDrivers',
      title: 'Available drivers',
      value: formatNumber(data.availableDrivers),
      subtitle: `${formatNumber(data.busyDrivers)} busy drivers`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      accent: data.availableDrivers > 0 ? ('success' as const) : ('warning' as const),
    },
    {
      key: 'openDispatcherTasks',
      title: 'Open dispatch tasks',
      value: formatNumber(data.openDispatcherTasksTotal),
      subtitle: 'Work that needs dispatcher action',
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      accent: data.openDispatcherTasksTotal > 0 ? ('info' as const) : ('success' as const),
    },
  ];

  const assignedTransports = data.transportOrdersByStatus.ASSIGNED ?? 0;
  const inTransitTransports = data.transportOrdersByStatus.IN_TRANSIT ?? 0;
  const newTasks = data.dispatcherTasksByStatus.NEW ?? 0;
  const inProgressTasks = data.dispatcherTasksByStatus.IN_PROGRESS ?? 0;

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

      <DashboardAlerts alerts={data.alerts} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(0, 0.65fr)' },
        }}
      >
        <SectionCard title="Transport queue" description="Newest transports that need planning or tracking.">
          <Stack spacing={1.25}>
            {data.recentTransportOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transport orders.
              </Typography>
            ) : (
              data.recentTransportOrders.map((order) => (
                <DashboardListItem
                  key={order.id}
                  title={order.orderNumber}
                  status={order.status}
                  priority={order.priority}
                  subtitle={formatRoute(order.sourceWarehouseName, order.destinationWarehouseName)}
                  meta={`Vehicle: ${order.vehicleRegistrationNumber ?? '-'} · Driver: ${order.assignedEmployeeName ?? '-'} · Departure: ${formatDate(order.departureTime)} · Planned arrival: ${formatDate(order.plannedArrivalTime)}`}
                />
              ))
            )}
          </Stack>
        </SectionCard>

        <Stack spacing={2}>
          <SectionCard title="Dispatch workload" description="Only statuses that require dispatcher attention.">
            <Stack spacing={1.25}>
              <Typography variant="body2">Unassigned transports: {formatNumber(data.unassignedTransportOrders)}</Typography>
              <Typography variant="body2">Assigned transports: {formatNumber(assignedTransports)}</Typography>
              <Typography variant="body2">In transit transports: {formatNumber(inTransitTransports)}</Typography>
              <Typography variant="body2">New dispatch tasks: {formatNumber(newTasks)}</Typography>
              <Typography variant="body2">In-progress dispatch tasks: {formatNumber(inProgressTasks)}</Typography>
            </Stack>
          </SectionCard>

          <SectionCard title="Execution capacity" description="Resources available for new assignments.">
            <Stack spacing={1.25}>
              <Typography variant="body2">Available vehicles: {formatNumber(data.availableVehicles)}</Typography>
              <Typography variant="body2">Vehicles in use: {formatNumber(data.vehiclesInUse)}</Typography>
              <Typography variant="body2">Available drivers: {formatNumber(data.availableDrivers)}</Typography>
              <Typography variant="body2">Busy drivers: {formatNumber(data.busyDrivers)}</Typography>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Available vehicles" description="First available candidates for assignment.">
          <Stack spacing={1.25}>
            {data.availableVehicleCandidates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No available vehicles.
              </Typography>
            ) : (
              data.availableVehicleCandidates.map((vehicle) => (
                <DashboardListItem
                  key={vehicle.id}
                  title={vehicle.registrationNumber}
                  status="AVAILABLE"
                  subtitle={`${vehicle.brand} ${vehicle.model} · ${vehicle.type}`}
                  meta={`Capacity: ${formatNumber(vehicle.capacity)}`}
                />
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
                <DashboardListItem
                  key={driver.id}
                  title={`${driver.firstName} ${driver.lastName}`}
                  status="AVAILABLE"
                  subtitle={driver.email}
                  meta={driver.phoneNumber || '-'}
                />
              ))
            )}
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}
