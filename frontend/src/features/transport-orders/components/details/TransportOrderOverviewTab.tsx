import { Link as RouterLink } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import EmptyState from '../../../../shared/components/EmptyState/EmptyState';
import StatusChip from '../../../../shared/components/StatusChip/StatusChip';
import SectionCard from '../../../../shared/components/SectionCard/SectionCard';
import { ForbiddenTransitionHint } from '../../../../shared/components/Lifecycle';
import { formatTemporalView, formatTemporalZone } from '../../../../core/utils/timezoneFormat';
import TransportOrderStatusChip from '../TransportOrderStatusChip';
import type {
  EmployeeOption,
  TransportOrderResponse,
  TransportOrderStatus,
  VehicleOption,
  WarehouseOption,
} from '../../types/transportOrder.types';
import { formatWeight, getStatusActionLabel } from './transportOrderDetailsUtils';

type TransportOrderOverviewTabProps = {
  transportOrder: TransportOrderResponse;
  sourceWarehouse?: WarehouseOption;
  destinationWarehouse?: WarehouseOption;
  vehicle?: VehicleOption;
  employee?: EmployeeOption;
  canChangeStatus: boolean;
  nextStatuses: TransportOrderStatus[];
  statusMutationPending: boolean;
  isEditableOrder: boolean;
  isEditableItems: boolean;
  onSelectTransition: (status: TransportOrderStatus) => void;
};

export default function TransportOrderOverviewTab({
  transportOrder,
  sourceWarehouse,
  destinationWarehouse,
  vehicle,
  employee,
  canChangeStatus,
  nextStatuses,
  statusMutationPending,
  isEditableOrder,
  isEditableItems,
  onSelectTransition,
}: TransportOrderOverviewTabProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <SectionCard title="Overview" description="Core transport order data confirmed by backend DTOs.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <TransportOrderStatusChip status={transportOrder.status} />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Priority
                </Typography>
                <StatusChip value={transportOrder.priority} />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Source warehouse
              </Typography>
              <Button component={RouterLink} to={`/warehouses/${transportOrder.sourceWarehouseId}`} size="small" sx={{ px: 0, minWidth: 0 }}>
                {sourceWarehouse?.name ?? `Warehouse #${transportOrder.sourceWarehouseId}`}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {sourceWarehouse ? `${sourceWarehouse.address}, ${sourceWarehouse.city}` : '—'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Destination warehouse
              </Typography>
              <Button component={RouterLink} to={`/warehouses/${transportOrder.destinationWarehouseId}`} size="small" sx={{ px: 0, minWidth: 0 }}>
                {destinationWarehouse?.name ?? `Warehouse #${transportOrder.destinationWarehouseId}`}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {destinationWarehouse
                  ? `${destinationWarehouse.address}, ${destinationWarehouse.city}`
                  : '—'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Vehicle
              </Typography>
              <Button component={RouterLink} to={`/vehicles/${transportOrder.vehicleId}`} size="small" sx={{ px: 0, minWidth: 0 }}>
                {vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle #${transportOrder.vehicleId}`}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {vehicle ? `${vehicle.registrationNumber} · ${vehicle.status}` : '—'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Driver
              </Typography>
              <Button component={RouterLink} to={`/employees/${transportOrder.assignedEmployeeId}`} size="small" sx={{ px: 0, minWidth: 0 }}>
                {employee
                  ? `${employee.firstName} ${employee.lastName}`
                  : `Employee #${transportOrder.assignedEmployeeId}`}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {employee?.email ?? '—'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Order date
              </Typography>
              <Typography variant="body1">{formatTemporalView(transportOrder.orderDateView, transportOrder.orderDate)}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Departure time
              </Typography>
              <Typography variant="body1">{formatTemporalView(transportOrder.departureTimeView, transportOrder.departureTime)} · {formatTemporalZone(transportOrder.departureTimeView, transportOrder.sourceTimezone)}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Planned arrival
              </Typography>
              <Typography variant="body1">
                {formatTemporalView(transportOrder.plannedArrivalTimeView, transportOrder.plannedArrivalTime)} · {formatTemporalZone(transportOrder.plannedArrivalTimeView, transportOrder.destinationTimezone)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Actual arrival
              </Typography>
              <Typography variant="body1">
                {formatTemporalView(transportOrder.actualArrivalTimeView, transportOrder.actualArrivalTime)} · {formatTemporalZone(transportOrder.actualArrivalTimeView, transportOrder.destinationTimezone)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Total weight
              </Typography>
              <Typography variant="body1">{formatWeight(transportOrder.totalWeight)}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Created by user ID
              </Typography>
              <Typography variant="body1">{transportOrder.createdById}</Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                Notes
              </Typography>
              <Typography variant="body1">{transportOrder.notes?.trim() || '—'}</Typography>
            </Grid>
          </Grid>
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <SectionCard title="Status actions" description="Allowed transitions follow backend service rules.">
          {!canChangeStatus ? (
            <>
              <EmptyState
                title="No status actions available"
                description="Your role can review the order but cannot change its status."
              />
              <ForbiddenTransitionHint visible message="Your role is not allowed to transition this transport order." />
            </>
          ) : nextStatuses.length === 0 ? (
            <>
              <EmptyState
                title="No more status actions"
                description="This transport order is already in a terminal state."
              />
              <ForbiddenTransitionHint visible message="No next transition is allowed from the current transport order status." />
            </>
          ) : (
            <Stack spacing={1.5}>
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant="contained"
                  disabled={statusMutationPending}
                  onClick={() => onSelectTransition(status)}
                >
                  {getStatusActionLabel(status)}
                </Button>
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard
          title="Item rules"
          description="Item create, edit and remove is allowed only while status is DRAFT."
        >
          <Typography variant="body2" color="text.secondary">
            Current status: {transportOrder.status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order editing enabled: {isEditableOrder ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Item editing enabled: {isEditableItems ? 'Yes' : 'No'}
          </Typography>
        </SectionCard>
      </Grid>
    </Grid>
  );
}
