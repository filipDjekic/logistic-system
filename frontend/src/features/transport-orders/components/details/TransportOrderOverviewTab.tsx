import { Link as RouterLink } from "react-router-dom";
import { Button, Grid, Stack } from "@mui/material";
import EmptyState from "../../../../shared/components/EmptyState/EmptyState";
import StatusChip from "../../../../shared/components/StatusChip/StatusChip";
import SectionCard from "../../../../shared/components/SectionCard/SectionCard";
import {
  DetailsMetadataCard,
  DetailsOverviewCard,
  DetailsStatisticsCard,
} from "../../../../shared/components/EntityDetails";
import { ForbiddenTransitionHint } from "../../../../shared/components/Lifecycle";
import {
  formatTemporalView,
  formatTemporalZone,
} from "../../../../core/utils/timezoneFormat";
import TransportOrderStatusChip from "../TransportOrderStatusChip";
import type {
  EmployeeOption,
  TransportOrderResponse,
  TransportOrderStatus,
  VehicleOption,
  WarehouseOption,
} from "../../types/transportOrder.types";
import {
  formatWeight,
  getStatusActionLabel,
} from "./transportOrderDetailsUtils";

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
        <Stack spacing={3}>
          <DetailsStatisticsCard
            title="Transport snapshot"
            description="Operational status, timing and load indicators for this order."
            statistics={[
              {
                title: "Status",
                value: (
                  <TransportOrderStatusChip status={transportOrder.status} />
                ),
                subtitle: "Current lifecycle state",
              },
              {
                title: "Priority",
                value: <StatusChip value={transportOrder.priority} />,
                subtitle: "Dispatch priority",
              },
              {
                title: "Total weight",
                value: formatWeight(transportOrder.totalWeight),
                subtitle: "Calculated from transport items",
              },
              {
                title: "Next actions",
                value: nextStatuses.length,
                subtitle: "Allowed status transitions",
              },
            ]}
          />

          <DetailsOverviewCard
            title="Overview"
            description="Core transport order information confirmed by backend DTOs."
            fields={[
              { label: "Order number", value: transportOrder.orderNumber },
              { label: "Description", value: transportOrder.description },
              {
                label: "Status",
                value: (
                  <TransportOrderStatusChip status={transportOrder.status} />
                ),
              },
              {
                label: "Priority",
                value: <StatusChip value={transportOrder.priority} />,
              },
              {
                label: "Source warehouse",
                value: (
                  <Button
                    component={RouterLink}
                    to={`/warehouses/${transportOrder.sourceWarehouseId}`}
                    size="small"
                    sx={{ px: 0, minWidth: 0 }}
                  >
                    {sourceWarehouse?.name ??
                      `Warehouse #${transportOrder.sourceWarehouseId}`}
                  </Button>
                ),
                helperText: sourceWarehouse
                  ? `${sourceWarehouse.address}, ${sourceWarehouse.city}`
                  : "—",
              },
              {
                label: "Destination warehouse",
                value: (
                  <Button
                    component={RouterLink}
                    to={`/warehouses/${transportOrder.destinationWarehouseId}`}
                    size="small"
                    sx={{ px: 0, minWidth: 0 }}
                  >
                    {destinationWarehouse?.name ??
                      `Warehouse #${transportOrder.destinationWarehouseId}`}
                  </Button>
                ),
                helperText: destinationWarehouse
                  ? `${destinationWarehouse.address}, ${destinationWarehouse.city}`
                  : "—",
              },
              {
                label: "Vehicle",
                value: (
                  <Button
                    component={RouterLink}
                    to={`/vehicles/${transportOrder.vehicleId}`}
                    size="small"
                    sx={{ px: 0, minWidth: 0 }}
                  >
                    {vehicle
                      ? `${vehicle.brand} ${vehicle.model}`
                      : `Vehicle #${transportOrder.vehicleId}`}
                  </Button>
                ),
                helperText: vehicle
                  ? `${vehicle.registrationNumber} · ${vehicle.status}`
                  : "—",
              },
              {
                label: "Driver",
                value: (
                  <Button
                    component={RouterLink}
                    to={`/employees/${transportOrder.assignedEmployeeId}`}
                    size="small"
                    sx={{ px: 0, minWidth: 0 }}
                  >
                    {employee
                      ? `${employee.firstName} ${employee.lastName}`
                      : `Employee #${transportOrder.assignedEmployeeId}`}
                  </Button>
                ),
                helperText: employee?.email ?? "—",
              },
              {
                label: "Order date",
                value: formatTemporalView(
                  transportOrder.orderDateView,
                  transportOrder.orderDate,
                ),
              },
              {
                label: "Departure time",
                value: formatTemporalView(
                  transportOrder.departureTimeView,
                  transportOrder.departureTime,
                ),
                helperText: formatTemporalZone(
                  transportOrder.departureTimeView,
                  transportOrder.sourceTimezone,
                ),
              },
              {
                label: "Planned arrival",
                value: formatTemporalView(
                  transportOrder.plannedArrivalTimeView,
                  transportOrder.plannedArrivalTime,
                ),
                helperText: formatTemporalZone(
                  transportOrder.plannedArrivalTimeView,
                  transportOrder.destinationTimezone,
                ),
              },
              {
                label: "Actual arrival",
                value: formatTemporalView(
                  transportOrder.actualArrivalTimeView,
                  transportOrder.actualArrivalTime,
                ),
                helperText: formatTemporalZone(
                  transportOrder.actualArrivalTimeView,
                  transportOrder.destinationTimezone,
                ),
              },
              {
                label: "Notes",
                value: transportOrder.notes?.trim() || "—",
                size: { xs: 12 },
              },
            ]}
          />

          <DetailsMetadataCard
            fields={[
              { label: "Transport order ID", value: transportOrder.id },
              { label: "Version", value: transportOrder.version },
              {
                label: "Created by user ID",
                value: transportOrder.createdById,
              },
              {
                label: "Source warehouse ID",
                value: transportOrder.sourceWarehouseId,
              },
              {
                label: "Destination warehouse ID",
                value: transportOrder.destinationWarehouseId,
              },
              { label: "Vehicle ID", value: transportOrder.vehicleId },
              { label: "Driver ID", value: transportOrder.assignedEmployeeId },
            ]}
          />
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <SectionCard
            title="Status actions"
            description="Allowed transitions follow backend service rules."
          >
            {!canChangeStatus ? (
              <>
                <EmptyState
                  title="No status actions available"
                  description="Your role can review the order but cannot change its status."
                />
                <ForbiddenTransitionHint
                  visible
                  message="Your role is not allowed to transition this transport order."
                />
              </>
            ) : nextStatuses.length === 0 ? (
              <>
                <EmptyState
                  title="No more status actions"
                  description="This transport order is already in a terminal state."
                />
                <ForbiddenTransitionHint
                  visible
                  message="No next transition is allowed from the current transport order status."
                />
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

          <DetailsOverviewCard
            title="Item rules"
            description="Item create, edit and remove is allowed only while status is DRAFT."
            columns={{ xs: 12 }}
            fields={[
              { label: "Current status", value: transportOrder.status },
              {
                label: "Order editing enabled",
                value: isEditableOrder ? "Yes" : "No",
              },
              {
                label: "Item editing enabled",
                value: isEditableItems ? "Yes" : "No",
              },
            ]}
          />
        </Stack>
      </Grid>
    </Grid>
  );
}
