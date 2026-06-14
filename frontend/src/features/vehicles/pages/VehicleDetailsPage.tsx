import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import { ForbiddenTransitionHint, LifecycleHistoryTimeline, LifecycleStatusGraph, LifecycleTransitionDialog } from '../../../shared/components/Lifecycle';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import ArchiveStatusBadge from '../../../shared/components/archive/ArchiveStatusBadge';
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
import { useVehicleMaintenance } from '../../vehicle-maintenance/hooks/useVehicleMaintenance';
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

function getAllowedNextStatuses(status: VehicleStatus): VehicleStatus[] {
  switch (status) {
    case 'AVAILABLE':
      return ['RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    case 'RESERVED':
      return ['IN_USE', 'AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    case 'IN_USE':
      return ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    case 'MAINTENANCE':
      return ['AVAILABLE', 'OUT_OF_SERVICE'];
    case 'OUT_OF_SERVICE':
      return ['AVAILABLE', 'MAINTENANCE'];
    default:
      return [];
  }
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
  const canViewHistory = canManage || auth.user?.role === ROLES.DISPATCHER;

  const vehicleQuery = useVehicle(validVehicleId);
  const vehicle = vehicleQuery.data;
  const transportOrdersQuery = useTransportOrders(
    { vehicleId: validVehicleId, page: 0, size: 10, sort: 'departureTime,desc' },
    Boolean(validVehicleId) && activeTab === 'transports',
  );
  const maintenanceQuery = useVehicleMaintenance(
    validVehicleId ? { vehicleId: validVehicleId, page: 0, size: 10, sort: 'scheduledAt,desc' } : undefined,
    Boolean(validVehicleId) && activeTab === 'maintenance',
  );

  const allowedTransitionsQuery = useQuery({
    queryKey: ['vehicles', validVehicleId, 'status-transitions'],
    queryFn: () => vehiclesApi.getAllowedStatusTransitions(Number(validVehicleId)),
    enabled: Boolean(validVehicleId) && canManage,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  const nextStatuses = useMemo(() => {
    if (!vehicle) return [];
    return allowedTransitionsQuery.data?.allowedStatuses ?? getAllowedNextStatuses(vehicle.status);
  }, [allowedTransitionsQuery.data, vehicle]);

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
            <Button variant="outlined" onClick={() => navigate('/vehicle-maintenance')}>Maintenance</Button>
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

  const vehicleRecommendedStep = (() => {
    if (vehicle.hasActiveMaintenance || vehicle.status === 'MAINTENANCE') {
      return {
        title: 'Resolve active maintenance before dispatch.',
        description: 'This vehicle has active maintenance context. Review maintenance records before assigning it to new transport work.',
        severity: 'warning' as const,
        actions: [{ label: 'Open maintenance', onClick: () => setActiveTab('maintenance') }],
      };
    }

    if (vehicle.status === 'AVAILABLE') {
      return {
        title: 'Vehicle is available for assignment.',
        description: 'Review transport history or open transport orders if this vehicle should be assigned to an upcoming route.',
        severity: 'success' as const,
        actions: [
          { label: 'Open transports', onClick: () => setActiveTab('transports') },
          { label: 'Transport orders', to: '/transport-orders', variant: 'outlined' as const },
        ],
      };
    }

    if (nextStatuses.length > 0 && canManage) {
      return {
        title: `Review vehicle status ${vehicle.status}.`,
        description: `Available next status: ${nextStatuses.join(', ')}. Change status only when the real fleet condition has changed.`,
        severity: 'info' as const,
        actions: [{ label: 'Open status actions', onClick: () => setActiveTab('overview') }],
      };
    }

    return {
      title: 'Review vehicle operational history.',
      description: 'No direct status action is currently available. Use transport and maintenance history to understand current fleet state.',
      severity: 'info' as const,
      actions: [
        { label: 'Open transports', onClick: () => setActiveTab('transports'), variant: 'outlined' as const },
        { label: 'Open maintenance', onClick: () => setActiveTab('maintenance'), variant: 'outlined' as const },
      ],
    };
  })();

  const tabs: { value: VehicleDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'transports', label: `Transport history${transportOrdersQuery.data ? ` (${transportOrdersQuery.data.totalElements})` : ''}` },
    { value: 'maintenance', label: `Maintenance${maintenanceQuery.data ? ` (${maintenanceQuery.data.totalElements})` : ''}` },
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
          <ArchiveStatusBadge archived={vehicle.status === 'OUT_OF_SERVICE' || vehicle.active === false} />
          {canManage && vehicle.status !== 'OUT_OF_SERVICE' ? (
            <Button variant="outlined" color="warning" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(vehicle.id)}>Archive</Button>
          ) : null}
          {canManage && vehicle.status === 'OUT_OF_SERVICE' ? (
            <Button variant="contained" color="success" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(vehicle.id)}>Restore</Button>
          ) : null}
          {canViewHistory ? (
            <Button variant="outlined" onClick={() => navigate(`/change-history?entityName=VEHICLE&entityId=${vehicle.id}`)}>Full history</Button>
          ) : null}
          <Button variant="outlined" onClick={() => navigate('/vehicle-maintenance')}>Maintenance</Button>
          <Button variant="outlined" onClick={() => navigate('/vehicles')}>Back to list</Button>
        </Stack>
      }
    >
      {(vehicle.status === 'OUT_OF_SERVICE' || vehicle.active === false) ? <ArchivedEntityAlert entityLabel="Vehicle" /> : null}
      <RecommendedNextStep {...vehicleRecommendedStep} />

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

          {canManage ? (
            <SectionCard title="Status actions" description="Uses the dedicated backend status endpoint with backend transition rules and a mandatory transition dialog.">
              {nextStatuses.length === 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary">No vehicle status transition is currently allowed.</Typography>
                  <ForbiddenTransitionHint visible message="The vehicle is locked by current lifecycle state, role or operational constraints." />
                </>
              ) : (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} flexWrap="wrap" useFlexGap>
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="contained"
                      disabled={changeStatusMutation.isPending}
                      onClick={() => setTransitionTarget(status)}
                    >
                      Set {status}
                    </Button>
                  ))}
                </Stack>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Final validation stays on the backend. Active transport or maintenance constraints are shown as forbidden action errors.
              </Typography>
            </SectionCard>
          ) : null}
        </Stack>
      ) : null}


      {activeTab === 'lifecycle' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <SectionCard title="Lifecycle graph" description="Fleet availability state with backend-allowed next transitions.">
              <LifecycleStatusGraph
                statuses={['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'] as const}
                currentStatus={vehicle.status}
                allowedNextStatuses={canManage ? nextStatuses : []}
                terminalStatuses={['OUT_OF_SERVICE'] as const}
              />
            </SectionCard>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <LifecycleHistoryTimeline entityName="VEHICLE" entityId={vehicle.id} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'transports' ? (
        <RelatedDataSection
          title="Transport history"
          description="Transport orders where this vehicle is assigned."
          action={<Button variant="outlined" onClick={() => navigate('/transport-orders')}>Open transports</Button>}
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
        <RelatedDataSection
          title="Maintenance history"
          description="Maintenance lifecycle records connected with this vehicle."
          action={<Button variant="outlined" onClick={() => navigate('/vehicle-maintenance')}>Open maintenance</Button>}
          loading={maintenanceQuery.isLoading}
          error={maintenanceQuery.isError}
          onRetry={() => { void maintenanceQuery.refetch(); }}
          empty={!maintenanceQuery.isLoading && !maintenanceQuery.isError && (maintenanceQuery.data?.content ?? []).length === 0}
          emptyTitle="No maintenance records"
        >
          <Stack spacing={1.25}>
            {(maintenanceQuery.data?.content ?? []).map((maintenance) => (
              <Stack key={maintenance.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={800}>{maintenance.type}</Typography>
                <Typography variant="body2" color="text.secondary">Scheduled: {formatDateTime(maintenance.scheduledAt)} · Cost: {maintenance.cost ?? '—'}</Typography>
                <Typography variant="body2" color="text.secondary">{maintenance.notes ?? 'No notes'}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StatusChip value={maintenance.status} />
                  {maintenance.activeMaintenance ? <StatusChip value="ACTIVE" /> : null}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </RelatedDataSection>
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
