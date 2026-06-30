import { useEffect, useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Button, Stack } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LifecycleTransitionDialog } from "../../../shared/components/Lifecycle";
import ErrorState from "../../../shared/components/ErrorState/ErrorState";
import DataTable from "../../../shared/components/DataTable/DataTable";
import ServerTablePagination from "../../../shared/components/ServerTablePagination/ServerTablePagination";
import StatusChip from "../../../shared/components/StatusChip/StatusChip";
import ArchivedEntityAlert from "../../../shared/components/archive/ArchivedEntityAlert";
import {
  DetailsLifecycleCard,
  DetailsMetadataCard,
  DetailsOverviewCard,
  DetailsStatisticsCard,
  EntityDetailsLayout,
  OperationalDetailsTabPanels,
  RelatedDataSection,
  buildOperationalTabs,
} from "../../../shared/components/EntityDetails";
import VehicleStatusChip from "../components/VehicleStatusChip";
import { useAppSnackbar } from "../../../app/providers/useSnackbar";
import { useAuthStore } from "../../../core/auth/authStore";
import { ROLES } from "../../../core/constants/roles";
import { getErrorMessage } from "../../../core/utils/getErrorMessage";
import { invalidateVehicleState } from "../../../core/utils/invalidateAppState";
import { useTransportOrders } from "../../transport-orders/hooks/useTransportOrders";
import VehicleMaintenanceSection from "../../vehicle-maintenance/components/VehicleMaintenanceSection";
import { vehiclesApi } from "../api/vehiclesApi";
import { useVehicle } from "../hooks/useVehicle";
import type { VehicleStatus } from "../types/vehicle.types";

type VehicleDetailsTab =
  | "overview"
  | "lifecycle"
  | "transports"
  | "maintenance"
  | "attachments"
  | "comments"
  | "audit"
  | "history";

function formatCapacity(value: number) {
  return `${value} kg`;
}

function formatOptionalNumber(value: number | null | undefined, suffix = "") {
  return value == null ? "—" : `${value}${suffix}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value.replace("T", " ")
    : date.toLocaleString();
}

export default function VehicleDetailsPage() {
  const auth = useAuthStore();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const vehicleId = Number(params.id);
  const validVehicleId = Number.isFinite(vehicleId) ? vehicleId : null;
  const [activeTab, setActiveTab] = useState<VehicleDetailsTab>("overview");
  const [transportPage, setTransportPage] = useState(0);
  const [transportSize, setTransportSize] = useState(10);
  const [transitionTarget, setTransitionTarget] =
    useState<VehicleStatus | null>(null);

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN;

  const vehicleQuery = useVehicle(validVehicleId);
  const vehicle = vehicleQuery.data;
  const transportOrdersQuery = useTransportOrders(
    {
      vehicleId: validVehicleId,
      page: transportPage,
      size: transportSize,
      sort: "departureTime,desc",
    },
    Boolean(validVehicleId) && activeTab === "transports",
  );
  const allowedTransitionsQuery = useQuery({
    queryKey: ["vehicles", validVehicleId, "status-transitions"],
    queryFn: () =>
      vehiclesApi.getAllowedStatusTransitions(Number(validVehicleId)),
    enabled: Boolean(validVehicleId) && canManage,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => vehiclesApi.archive(id),
    onSuccess: async () => {
      showSnackbar({
        message: "Vehicle archived successfully.",
        severity: "success",
      });
      await invalidateVehicleState(queryClient, vehicleId);
    },
    onError: (error) =>
      showSnackbar({ message: getErrorMessage(error), severity: "error" }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => vehiclesApi.restore(id),
    onSuccess: async () => {
      showSnackbar({
        message: "Vehicle restored successfully.",
        severity: "success",
      });
      await invalidateVehicleState(queryClient, vehicleId);
    },
    onError: (error) =>
      showSnackbar({ message: getErrorMessage(error), severity: "error" }),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
      expectedVersion,
    }: {
      id: number;
      status: VehicleStatus;
      reason?: string;
      expectedVersion?: number;
    }) => vehiclesApi.changeStatus(id, status, reason, expectedVersion),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Vehicle status updated to ${variables.status}.`,
        severity: "success",
      });
      await invalidateVehicleState(queryClient, variables.id);
      setTransitionTarget(null);
      await allowedTransitionsQuery.refetch();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: "error" });
    },
  });

  useEffect(() => {
    if (!vehicle || ["AVAILABLE", "OUT_OF_SERVICE"].includes(vehicle.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void vehicleQuery.refetch();
      void allowedTransitionsQuery.refetch();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [vehicle, vehicleQuery, allowedTransitionsQuery]);

  if (!Number.isFinite(vehicleId)) {
    return (
      <ErrorState
        title="Invalid vehicle"
        description="The vehicle ID in the route is not valid."
      />
    );
  }

  if (vehicleQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Fleet"
        title="Vehicle details"
        loading
        loadingText="Loading vehicle details..."
        actionItems={[
          { label: "Back to list", onClick: () => navigate("/vehicles") },
        ]}
      >
        <></>
      </EntityDetailsLayout>
    );
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <ErrorState
        title="Vehicle could not be loaded"
        description="The requested vehicle details are not available."
        onRetry={() => void vehicleQuery.refetch()}
      />
    );
  }

  const allowedVehicleStatuses = allowedTransitionsQuery.data?.allowedStatuses ?? [];
  const vehicleLifecycleStatuses: VehicleStatus[] = vehicle.status === "OUT_OF_SERVICE"
    ? ["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"]
    : ["AVAILABLE", "RESERVED", "IN_USE", "MAINTENANCE"];
  const vehicleLifecycleActions = allowedVehicleStatuses.map((status) => ({
    key: status,
    label: status === "AVAILABLE" ? "Mark available" : status === "MAINTENANCE" ? "Send to maintenance" : status === "OUT_OF_SERVICE" ? "Take out of service" : `Set status to ${status}`,
    variant: "contained" as const,
    disabled: changeStatusMutation.isPending,
    onClick: () => setTransitionTarget(status),
  }));

  const tabs: { value: string; label: ReactNode; disabled?: boolean }[] = [
    { value: "overview", label: "Overview" },
    { value: "lifecycle", label: "Lifecycle" },
    {
      value: "transports",
      label: `Related data${transportOrdersQuery.data ? ` (${transportOrdersQuery.data.totalElements})` : ""}`,
    },
    { value: "maintenance", label: "Maintenance" },
    ...buildOperationalTabs({ entityType: "VEHICLE", entityName: "VEHICLE", entityId: vehicle.id, allowCreateAttachments: canManage, allowCreateComments: canManage }),
  ];

  return (
    <EntityDetailsLayout
      overline="Fleet"
      title={`${vehicle.brand} ${vehicle.model}`}
      description={`Vehicle #${vehicle.id} • ${vehicle.registrationNumber}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as VehicleDetailsTab)}
      breadcrumbs={[
        { label: "Vehicles", to: "/vehicles" },
        { label: vehicle.registrationNumber },
      ]}
      hero={{
        overline: "Fleet",
        title: `${vehicle.brand} ${vehicle.model}`,
        subtitle: vehicle.registrationNumber,
        description: `Vehicle #${vehicle.id} used for transport order execution and fleet operations.`,
        avatar: vehicle.registrationNumber.slice(0, 2).toUpperCase(),
        statusNode: <VehicleStatusChip status={vehicle.status} />,
        primaryInfo: [
          { label: "Type", value: vehicle.type },
          { label: "Capacity", value: formatCapacity(vehicle.capacity) },
          { label: "Fuel", value: vehicle.fuelType },
          { label: "Company", value: vehicle.companyName ?? "—" },
        ],
      }}
      actionItems={[
        ...(canManage && vehicle.status !== "OUT_OF_SERVICE"
          ? [
              {
                label: "Archive",
                color: "warning" as const,
                disabled: archiveMutation.isPending,
                onClick: () => archiveMutation.mutate(vehicle.id),
              },
            ]
          : []),
        ...(canManage && vehicle.status === "OUT_OF_SERVICE"
          ? [
              {
                label: "Restore",
                variant: "contained" as const,
                color: "success" as const,
                disabled: restoreMutation.isPending,
                onClick: () => restoreMutation.mutate(vehicle.id),
              },
            ]
          : []),
        { label: "Back to list", onClick: () => navigate("/vehicles") },
      ]}
    >
      {vehicle.status === "OUT_OF_SERVICE" || vehicle.active === false ? (
        <ArchivedEntityAlert entityLabel="Vehicle" />
      ) : null}

      {activeTab === "overview" ? (
        <Stack spacing={3}>
          <DetailsStatisticsCard
            title="Fleet snapshot"
            description="Quick operational indicators for this vehicle."
            statistics={[
              {
                title: "Capacity",
                value: formatCapacity(vehicle.capacity),
                subtitle: "Nominal payload capacity",
              },
              {
                title: "Max weight",
                value: formatOptionalNumber(vehicle.maxWeight, " kg"),
                subtitle: "Weight constraint",
              },
              {
                title: "Max volume",
                value: formatOptionalNumber(vehicle.maxVolume),
                subtitle: "Volume constraint",
              },
              {
                title: "Maintenance",
                value: vehicle.hasActiveMaintenance ? "Active" : "Clear",
                subtitle: "Current maintenance state",
                accent: vehicle.hasActiveMaintenance ? "warning" : "success",
              },
            ]}
          />

          <DetailsOverviewCard
            title="Overview"
            description="Most important vehicle information used by dispatch and transport planning."
            fields={[
              {
                label: "Registration number",
                value: vehicle.registrationNumber,
              },
              { label: "Brand", value: vehicle.brand },
              { label: "Model", value: vehicle.model },
              { label: "Type", value: vehicle.type },
              { label: "Fuel type", value: vehicle.fuelType },
              { label: "Year of production", value: vehicle.yearOfProduction },
              { label: "Capacity", value: formatCapacity(vehicle.capacity) },
              {
                label: "Max weight",
                value: formatOptionalNumber(vehicle.maxWeight, " kg"),
              },
              {
                label: "Max volume",
                value: formatOptionalNumber(vehicle.maxVolume),
              },
              {
                label: "Max items",
                value: formatOptionalNumber(vehicle.maxItems),
              },
              {
                label: "Status",
                value: <VehicleStatusChip status={vehicle.status} />,
              },
              {
                label: "Active maintenance",
                value: vehicle.hasActiveMaintenance ? "Yes" : "No",
              },
            ]}
          />

          <DetailsMetadataCard
            fields={[
              { label: "Vehicle ID", value: vehicle.id },
              { label: "Version", value: vehicle.version },
              { label: "Company", value: vehicle.companyName ?? "—" },
              { label: "Company ID", value: vehicle.companyId ?? "—" },
              {
                label: "Active",
                value: vehicle.active === false ? "No" : "Yes",
              },
            ]}
          />
        </Stack>
      ) : null}

      {activeTab === "lifecycle" ? (
        <DetailsLifecycleCard
          currentStatus={vehicle.status}
          statusNode={<VehicleStatusChip status={vehicle.status} />}
          statusDescription="Vehicle lifecycle controls dispatch availability, maintenance and service state."
          statuses={vehicleLifecycleStatuses}
          allowedNextStatuses={allowedVehicleStatuses}
          terminalStatuses={["OUT_OF_SERVICE"]}
          actions={canManage ? vehicleLifecycleActions : []}
          noActionsText={canManage ? "No lifecycle transition is currently available." : "Your role cannot change vehicle lifecycle status."}
          historyEntityName="VEHICLE"
          historyEntityId={vehicle.id}
        />
      ) : null}

      {activeTab === "transports" ? (
        <RelatedDataSection
          title="Transport history"
          description="Transport orders where this vehicle is assigned."
          loading={transportOrdersQuery.isLoading}
          error={transportOrdersQuery.isError}
          onRetry={() => {
            void transportOrdersQuery.refetch();
          }}
          empty={
            !transportOrdersQuery.isLoading &&
            !transportOrdersQuery.isError &&
            (transportOrdersQuery.data?.content ?? []).length === 0
          }
          emptyTitle="No transport history"
        >
          <DataTable
            columns={[
              { id: "orderNumber", header: "Order", render: (order) => <Button component={RouterLink} to={`/transport-orders/${order.id}`} size="small" sx={{ px: 0, minWidth: 0, fontWeight: 800 }}>{order.orderNumber}</Button> },
              { id: "description", header: "Description", render: (order) => order.description ?? "—" },
              { id: "departure", header: "Departure", render: (order) => formatDateTime(order.departureTime) },
              { id: "status", header: "Status", render: (order) => <StatusChip value={order.status} /> },
              { id: "actions", header: "Action", align: "right", render: (order) => <Button size="small" component={RouterLink} to={`/transport-orders/${order.id}`}>Open</Button> },
            ]}
            rows={transportOrdersQuery.data?.content ?? []}
            getRowId={(order) => order.id}
            loading={transportOrdersQuery.isLoading}
            error={transportOrdersQuery.isError}
            onRetry={() => { void transportOrdersQuery.refetch(); }}
            size="small"
            minWidth={840}
            emptyTitle="No transport history"
            emptyDescription="This vehicle is not assigned to any transport orders yet."
            pagination={
              <ServerTablePagination
                page={transportOrdersQuery.data}
                disabled={transportOrdersQuery.isFetching}
                onPageChange={setTransportPage}
                onSizeChange={(nextSize) => { setTransportSize(nextSize); setTransportPage(0); }}
              />
            }
          />
        </RelatedDataSection>
      ) : null}

      {activeTab === "maintenance" ? (
        <VehicleMaintenanceSection
          fixedVehicle={{
            id: vehicle.id,
            label: vehicle.registrationNumber,
          }}
          canManage={canManage}
        />
      ) : null}

      <OperationalDetailsTabPanels
        activeTab={activeTab}
        entityType="VEHICLE"
        entityName="VEHICLE"
        entityId={vehicle.id}
        allowCreateAttachments={canManage}
        allowCreateComments={canManage}
      />

      <LifecycleTransitionDialog
        open={transitionTarget != null}
        entityLabel={`vehicle ${vehicle.registrationNumber}`}
        fromStatus={vehicle.status}
        toStatus={transitionTarget}
        optimisticVersion={vehicle.version}
        loading={changeStatusMutation.isPending}
        onClose={() => setTransitionTarget(null)}
        onConfirm={(reason) => {
          if (!transitionTarget) return;
          changeStatusMutation.mutate({
            id: vehicle.id,
            status: transitionTarget,
            reason,
            expectedVersion: vehicle.version,
          });
        }}
      />
    </EntityDetailsLayout>
  );
}
