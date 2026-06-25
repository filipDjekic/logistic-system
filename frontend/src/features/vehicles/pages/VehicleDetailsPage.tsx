import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { LifecycleHistoryTimeline, LifecycleTransitionDialog } from '../../../shared/components/Lifecycle';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import VehicleStatusChip from '../components/VehicleStatusChip';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateVehicleState } from '../../../core/utils/invalidateAppState';
import { useTransportOrders } from '../../transport-orders/hooks/useTransportOrders';
import VehicleMaintenanceSection from '../../vehicle-maintenance/components/VehicleMaintenanceSection';
import { vehiclesApi } from '../api/vehiclesApi';
import { useVehicle } from '../hooks/useVehicle';
import type { VehicleStatus } from '../types/vehicle.types';

type VehicleDetailsTab = 'overview' | 'lifecycle' | 'transports' | 'maintenance' | 'commentsAttachments' | 'domainEvents' | 'changeHistory';

function formatCapacity(value: number) {
  return `${value} kg`;
}

function formatOptionalNumber(value: number | null | undefined, suffix = '') {
  return value == null ? '—' : `${value}${suffix}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>{value ?? '—'}</Typography>
    </Stack>
  );
}

export default function VehicleDetailsPage() {
  const auth = useAuthStore();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const vehicleId = Number(params.id);
  const validVehicleId = Number.isFinite(vehicleId) ? vehicleId : null;
  const [activeTab, setActiveTab] = useState<VehicleDetailsTab>('overview');
  const [transitionTarget, setTransitionTarget] = useState<VehicleStatus | null>(null);

  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const vehicleQuery = useVehicle(validVehicleId);
  const vehicle = vehicleQuery.data;
  const transportOrdersQuery = useTransportOrders(
    { vehicleId: validVehicleId, page: 0, size: 10, sort: 'departureTime,desc' },
    Boolean(validVehicleId) && activeTab === 'transports',
  );
  const allowedTransitionsQuery = useQuery({
    queryKey: ['vehicles', validVehicleId, 'status-transitions'],
    queryFn: () => vehiclesApi.getAllowedStatusTransitions(Number(validVehicleId)),
    enabled: Boolean(validVehicleId) && canManage,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => vehiclesApi.archive(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Vehicle archived successfully.', severity: 'success' });
      await invalidateVehicleState(queryClient, vehicleId);
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => vehiclesApi.restore(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Vehicle restored successfully.', severity: 'success' });
      await invalidateVehicleState(queryClient, vehicleId);
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status, reason, expectedVersion }: { id: number; status: VehicleStatus; reason?: string; expectedVersion?: number }) => vehiclesApi.changeStatus(id, status, reason, expectedVersion),
    onSuccess: async (_, variables) => {
      showSnackbar({ message: `Vehicle status updated to ${variables.status}.`, severity: 'success' });
      await invalidateVehicleState(queryClient, variables.id);
      setTransitionTarget(null);
      await allowedTransitionsQuery.refetch();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  useEffect(() => {
    if (!vehicle || ['AVAILABLE', 'OUT_OF_SERVICE'].includes(vehicle.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void vehicleQuery.refetch();
      void allowedTransitionsQuery.refetch();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [vehicle, vehicleQuery, allowedTransitionsQuery]);

  if (!Number.isFinite(vehicleId)) {
    return <ErrorState title="Invalid vehicle" description="The vehicle ID in the route is not valid." />;
  }

  if (vehicleQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Fleet"
        title="Vehicle details"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/vehicles')}>Back to list</Button>
          </Stack>
        }
      >
        <SectionCard><Typography color="text.secondary">Loading vehicle details...</Typography></SectionCard>
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

  const tabs: { value: VehicleDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'transports', label: `Transport history${transportOrdersQuery.data ? ` (${transportOrdersQuery.data.totalElements})` : ''}` },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'commentsAttachments', label: 'Comments & attachments' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Fleet"
      title={`${vehicle.brand} ${vehicle.model}`}
      description={`Vehicle #${vehicle.id} • ${vehicle.registrationNumber}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as VehicleDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {canManage && vehicle.status !== 'OUT_OF_SERVICE' ? (
            <Button variant="outlined" color="warning" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(vehicle.id)}>Archive</Button>
          ) : null}
          {canManage && vehicle.status === 'OUT_OF_SERVICE' ? (
            <Button variant="contained" color="success" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(vehicle.id)}>Restore</Button>
          ) : null}
          <Button variant="outlined" onClick={() => navigate('/vehicles')}>Back to list</Button>
        </Stack>
      }
    >
      {(vehicle.status === 'OUT_OF_SERVICE' || vehicle.active === false) ? <ArchivedEntityAlert entityLabel="Vehicle" /> : null}

      {activeTab === 'overview' ? (
        <Stack spacing={3}>
          <SectionCard title="Vehicle overview" description="Confirmed backend fields for the selected vehicle.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Registration number" value={vehicle.registrationNumber} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Brand" value={vehicle.brand} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Model" value={vehicle.model} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Type" value={vehicle.type} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Fuel type" value={vehicle.fuelType} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Year of production" value={vehicle.yearOfProduction} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Capacity" value={formatCapacity(vehicle.capacity)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Max weight" value={formatOptionalNumber(vehicle.maxWeight, ' kg')} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Max volume" value={formatOptionalNumber(vehicle.maxVolume)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Max items" value={formatOptionalNumber(vehicle.maxItems)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <VehicleStatusChip status={vehicle.status} />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Company" value={vehicle.companyName ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Active maintenance" value={vehicle.hasActiveMaintenance ? 'Yes' : 'No'} /></Grid>
            </Grid>
          </SectionCard>
        </Stack>
      ) : null}


      {activeTab === 'lifecycle' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <LifecycleHistoryTimeline entityName="VEHICLE" entityId={vehicle.id} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'transports' ? (
        <RelatedDataSection
          title="Transport history"
          description="Transport orders where this vehicle is assigned."
          loading={transportOrdersQuery.isLoading}
          error={transportOrdersQuery.isError}
          onRetry={() => { void transportOrdersQuery.refetch(); }}
          empty={!transportOrdersQuery.isLoading && !transportOrdersQuery.isError && (transportOrdersQuery.data?.content ?? []).length === 0}
          emptyTitle="No transport history"
        >
          <Stack spacing={1.25}>
            {(transportOrdersQuery.data?.content ?? []).map((order) => (
              <Stack key={order.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Button component={RouterLink} to={`/transport-orders/${order.id}`} size="small" sx={{ alignSelf: 'flex-start', px: 0, minWidth: 0, fontWeight: 800 }}>
                  {order.orderNumber}
                </Button>
                <Typography variant="body2" color="text.secondary">{order.description}</Typography>
                <Typography variant="caption" color="text.secondary">Departure: {formatDateTime(order.departureTime)}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StatusChip value={order.status} />
                  <Button size="small" component={RouterLink} to={`/transport-orders/${order.id}`}>Open</Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </RelatedDataSection>
      ) : null}

      {activeTab === 'maintenance' ? (
        <VehicleMaintenanceSection
          fixedVehicle={{
            id: vehicle.id,
            label: vehicle.registrationNumber,
          }}
          canManage={canManage}
        />
      ) : null}

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}><CommentsPanel entityType="VEHICLE" entityId={vehicle.id} allowCreate={canManage} /></Grid>
          <Grid size={{ xs: 12, lg: 6 }}><AttachmentsPanel entityType="VEHICLE" entityId={vehicle.id} allowCreate={canManage} /></Grid>
        </Grid>
      ) : null}

      {activeTab === 'domainEvents' ? <DomainEventsPanel entityType="VEHICLE" entityId={vehicle.id} /> : null}

      {activeTab === 'changeHistory' ? <ChangeHistoryPanel entityName="VEHICLE" entityId={vehicle.id} /> : null}

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
          changeStatusMutation.mutate({ id: vehicle.id, status: transitionTarget, reason, expectedVersion: vehicle.version });
        }}
      />
    </EntityDetailsLayout>
  );
}
