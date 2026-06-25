import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildSortParam } from '../../../core/api/pagination';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import { useTasks } from '../../tasks/hooks/useTasks';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { stockMovementsApi } from '../api/stockMovementsApi';
import StockMovementLifecycleTimeline from '../components/StockMovementLifecycleTimeline';
import {
  canUseLifecycleAction,
  normalizeStockMovementStatus,
  stockMovementLifecycleActions,
  type StockMovementLifecycleAction,
} from '../utils/stockMovementLifecycle';


const stockMovementAttachmentTypeOptions = [
  { value: 'DELIVERY_NOTE', label: 'Delivery note / otpremnica' },
  { value: 'REPORT', label: 'Report / zapisnik' },
  { value: 'DAMAGE_PHOTO', label: 'Damage photo' },
  { value: 'WRITE_OFF_EVIDENCE', label: 'Write-off evidence' },
  { value: 'ADJUSTMENT_EVIDENCE', label: 'Adjustment evidence' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'OTHER', label: 'Other' },
] as const;

type StockMovementDetailsTab = 'overview' | 'relatedEntities' | 'movementTrace' | 'activity';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} component="div">
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

function binDetailsPath(warehouseId: number, zoneId: number | null | undefined, binId: number | null | undefined) {
  if (!zoneId || !binId) {
    return `/warehouses/${warehouseId}/zones`;
  }

  return `/warehouses/${warehouseId}/zones/${zoneId}/bins/${binId}`;
}

function formatOptionalNumber(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : value;
}


function formatMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  const code = currency?.trim() || '';
  return code ? `${value} ${code}` : value;
}

export default function StockMovementDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const movementId = Number(params.id);
  const validMovementId = Number.isInteger(movementId) && movementId > 0 ? movementId : null;
  const [activeTab, setActiveTab] = useState<StockMovementDetailsTab>('overview');
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<StockMovementLifecycleAction | null>(null);

  const stockMovementQuery = useQuery({
    queryKey: validMovementId ? queryKeys.stockMovements.detail(validMovementId) : ['stock-movements', 'details', 'invalid'],
    queryFn: () => stockMovementsApi.getById(validMovementId as number),
    enabled: Boolean(validMovementId),
  });

  const traceQuery = useQuery({
    queryKey: validMovementId ? queryKeys.stockMovements.trace(validMovementId) : ['stock-movements', 'trace', 'invalid'],
    queryFn: () => stockMovementsApi.trace(validMovementId as number),
    enabled: Boolean(validMovementId) && activeTab === 'movementTrace',
  });

  const statusTransitionsQuery = useQuery({
    queryKey: validMovementId ? queryKeys.stockMovements.statusTransitions(validMovementId) : ['stock-movements', 'status-transitions', 'invalid'],
    queryFn: () => stockMovementsApi.getStatusTransitions(validMovementId as number),
    enabled: Boolean(validMovementId),
  });

  const relatedTasksQuery = useTasks(
    validMovementId
      ? {
          stockMovementId: validMovementId,
          page: 0,
          size: 8,
          sort: buildSortParam({ field: 'dueDate', direction: 'desc' }),
        }
      : undefined,
    Boolean(validMovementId) && activeTab === 'relatedEntities',
  );

  const movement = stockMovementQuery.data;
  const currentStatus = statusTransitionsQuery.data?.currentStatus ?? movement?.status ?? 'EXECUTED';
  const allowedNextStatuses = statusTransitionsQuery.data?.allowedStatuses ?? movement?.allowedNextStatuses ?? [];

  const refreshStockMovementDetails = async () => {
    if (!validMovementId) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements.root() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements.detail(validMovementId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements.statusTransitions(validMovementId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements.trace(validMovementId) }),
    ]);
  };

  const executeMutation = useMutation({
    mutationFn: (id: number) => stockMovementsApi.execute(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Stock movement executed successfully.', severity: 'success' });
      await refreshStockMovementDetails();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => stockMovementsApi.cancel(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Stock movement cancelled successfully.', severity: 'success' });
      await refreshStockMovementDetails();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => stockMovementsApi.approve(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Stock movement approved successfully.', severity: 'success' });
      await refreshStockMovementDetails();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => stockMovementsApi.reject(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Stock movement rejected successfully.', severity: 'success' });
      await refreshStockMovementDetails();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: (id: number) => stockMovementsApi.reverse(id),
    onSuccess: async (reversal) => {
      showSnackbar({ message: `Stock movement reversed. Reversal movement #${reversal.id} was created.`, severity: 'success' });
      await refreshStockMovementDetails();
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });
  const canManageOperationalNotes =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;
  const canExecuteLifecycleAction =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER ||
    auth.user?.role === ROLES.DISPATCHER;
  const canApproveLifecycleAction =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;
  const lifecycleActionPending = executeMutation.isPending || cancelMutation.isPending || approveMutation.isPending || rejectMutation.isPending || reverseMutation.isPending;
  const currentLifecycleStatus = normalizeStockMovementStatus(currentStatus);
  const visibleLifecycleActions = movement
    ? stockMovementLifecycleActions.filter((action) => canUseLifecycleAction(action, allowedNextStatuses, {
        canApprove: canApproveLifecycleAction,
        canExecute: canExecuteLifecycleAction,
        movement,
      }))
    : [];
  const pendingActionDefinition = stockMovementLifecycleActions.find((action) => action.key === pendingLifecycleAction) ?? null;

  const runLifecycleAction = (action: StockMovementLifecycleAction) => {
    if (!movement) {
      return;
    }

    const mutationMap = {
      approve: approveMutation,
      reject: rejectMutation,
      execute: executeMutation,
      cancel: cancelMutation,
      reverse: reverseMutation,
    } as const;

    setPendingLifecycleAction(null);
    mutationMap[action].mutate(movement.id);
  };

  if (!validMovementId) {
    return (
      <ErrorState
        title="Invalid stock movement"
        description="The stock movement ID in the route is not valid."
      />
    );
  }

  if (stockMovementQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Inventory"
        title="Stock movement details"
        description="Loading stock movement details..."
        actions={<Button variant="outlined" onClick={() => navigate('/stock-movements')}>Back to list</Button>}
      >
        <SectionCard>
          <Typography color="text.secondary">Loading stock movement details...</Typography>
        </SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (stockMovementQuery.isError || !movement) {
    return (
      <ErrorState
        title="Stock movement could not be loaded"
        description="The requested stock movement details are not available."
        onRetry={() => { void stockMovementQuery.refetch(); }}
      />
    );
  }

  const tabs: { value: StockMovementDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'relatedEntities', label: `Related entities${relatedTasksQuery.data ? ` (${relatedTasksQuery.data.totalElements})` : ''}` },
    { value: 'movementTrace', label: `Movement trace${traceQuery.data ? ` (${traceQuery.data.movements.length})` : ''}` },
    { value: 'activity', label: 'Activity' },
  ];

  return (
    <EntityDetailsLayout
      overline="Inventory"
      title={`Stock movement #${movement.id}`}
      description={`${movement.movementType} • ${currentStatus} • ${movement.warehouseName} • ${movement.productName}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as StockMovementDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {visibleLifecycleActions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant}
              color={action.color}
              onClick={() => setPendingLifecycleAction(action.key)}
              disabled={lifecycleActionPending}
            >
              {action.label}
            </Button>
          ))}
          <Button variant="outlined" onClick={() => navigate('/stock-movements')}>
            Back to list
          </Button>
        </Stack>
      }
    >

      {activeTab === 'overview' ? (
        <Stack spacing={3}>
          <SectionCard title="Movement overview">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary">Movement type</Typography>
                  <StatusChip value={movement.movementType} />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary">Lifecycle status</Typography>
                  <StatusChip value={currentStatus} emphasis="strong" />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Movement ID" value={movement.id} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Quantity" value={movement.quantity} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Created at" value={formatDateTime(movement.createdAt)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Warehouse" value={<Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}`}>{movement.warehouseName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Product" value={<Button size="small" component={RouterLink} to={`/products/${movement.productId}`}>{movement.productName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Reason code" value={movement.reasonCode ?? '—'} /></Grid>
              <Grid size={{ xs: 12 }}><InfoRow label="Reason description" value={movement.reasonDescription ?? '—'} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Lifecycle workflow" description="Status is controlled by backend actions. Users do not edit status manually.">
            <Stack spacing={2}>
              {statusTransitionsQuery.isError ? (
                <Alert severity="warning">Allowed lifecycle transitions could not be loaded.</Alert>
              ) : null}

              <StockMovementLifecycleTimeline
                movement={movement}
                currentStatus={currentLifecycleStatus}
                allowedNextStatuses={allowedNextStatuses}
              />

              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight={800}>Available actions</Typography>
                {visibleLifecycleActions.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {visibleLifecycleActions.map((action) => (
                      <Button
                        key={action.key}
                        variant={action.variant}
                        color={action.color}
                        onClick={() => setPendingLifecycleAction(action.key)}
                        disabled={lifecycleActionPending}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No lifecycle action is currently available for your role and this status.</Typography>
                )}
              </Stack>
            </Stack>
          </SectionCard>



          <SectionCard title="Batch and serial tracking" description="Shows batch/lot, expiration and serialized stock trace data captured with this movement.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Batch / lot" value={movement.batchLotNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Expiration date" value={movement.batchExpirationDate ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Serial numbers" value={movement.serialNumbers ?? '—'} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Expected vs actual" description="Shows operational quantity variance for transport, receiving, damage and shortage scenarios.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Expected quantity" value={formatOptionalNumber(movement.expectedQuantity)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Actual quantity" value={formatOptionalNumber(movement.actualQuantity)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Discrepancy" value={formatOptionalNumber(movement.discrepancyQuantity)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Discrepancy reason" value={movement.discrepancyReason ?? '—'} /></Grid>
              <Grid size={{ xs: 12 }}><InfoRow label="Discrepancy note" value={movement.discrepancyNote ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Transport link" value={movement.transportOrderId ? <Button size="small" component={RouterLink} to={`/transport-orders/${movement.transportOrderId}`}>Transport order #{movement.transportOrderId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference" value={movement.referenceType ? `${movement.referenceType}${movement.referenceId ? ` #${movement.referenceId}` : ''}` : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference code" value={movement.referenceCode ?? movement.referenceNumber ?? '—'} /></Grid>
            </Grid>
          </SectionCard>


          <SectionCard title="Cost and valuation" description="Cost fields are captured on the movement and used by backend inventory valuation when available.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Unit cost" value={formatMoney(movement.unitCost, movement.currency)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Total cost" value={formatMoney(movement.totalCost, movement.currency)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Currency" value={movement.currency ?? '—'} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Inventory impact">
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Quantity" value={`${movement.quantityBefore} → ${movement.quantityAfter}`} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reserved" value={`${formatOptionalNumber(movement.reservedBefore)} → ${formatOptionalNumber(movement.reservedAfter)}`} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Available" value={`${formatOptionalNumber(movement.availableBefore)} → ${formatOptionalNumber(movement.availableAfter)}`} /></Grid>
              </Grid>
            </Stack>
          </SectionCard>
        </Stack>
      ) : null}

      {activeTab === 'relatedEntities' ? (
        <Stack spacing={3}>
          <SectionCard title="Related entities">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Warehouse" value={<Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}`}>{movement.warehouseName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Product" value={<Button size="small" component={RouterLink} to={`/products/${movement.productId}`}>{movement.productName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Inventory record" value={<Button size="small" component={RouterLink} to={`/inventory/${movement.warehouseId}/${movement.productId}`}>Open inventory</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Transport order" value={movement.transportOrderId ? <Button size="small" component={RouterLink} to={`/transport-orders/${movement.transportOrderId}`}>#{movement.transportOrderId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Source bin" value={movement.sourceBinId ? <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.sourceBinZoneId, movement.sourceBinId)}>{movement.sourceBinCode ?? `#${movement.sourceBinId}`}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Destination bin" value={movement.destinationBinId ? <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.destinationBinZoneId, movement.destinationBinId)}>{movement.destinationBinCode ?? `#${movement.destinationBinId}`}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Parent movement" value={movement.parentMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${movement.parentMovementId}`}>#{movement.parentMovementId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Root movement" value={movement.rootMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${movement.rootMovementId}`}>#{movement.rootMovementId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reversal of" value={movement.reversalOfMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${movement.reversalOfMovementId}`}>#{movement.reversalOfMovementId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reversed by" value={movement.reversedByMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${movement.reversedByMovementId}`}>#{movement.reversedByMovementId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Transfer group" value={movement.transferGroupId ?? '—'} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Reference">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference type" value={movement.referenceType ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference ID" value={movement.referenceId ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference code" value={movement.referenceCode ?? movement.referenceNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Source" value={movement.sourceType ? `${movement.sourceType}${movement.sourceId ? ` #${movement.sourceId}` : ''}` : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference number" value={movement.referenceNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference note" value={movement.referenceNote ?? '—'} /></Grid>
            </Grid>
          </SectionCard>

          <RelatedDataSection
            title="Linked tasks"
            description="Operational tasks connected with this stock movement."
            loading={relatedTasksQuery.isLoading}
            error={relatedTasksQuery.isError}
            onRetry={() => { void relatedTasksQuery.refetch(); }}
            empty={!relatedTasksQuery.isLoading && !relatedTasksQuery.isError && (relatedTasksQuery.data?.content ?? []).length === 0}
            emptyTitle="No linked tasks"
            emptyDescription="There are no tasks linked with this stock movement."
          >
            <Stack spacing={1.25}>
              {(relatedTasksQuery.data?.content ?? []).map((task) => (
                <Stack key={task.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={800}>{task.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{task.priority} · {formatDateTime(task.dueDate)}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={task.taskType} variant="outlined" />
                    <StatusChip value={task.status} />
                    <Button size="small" component={RouterLink} to={`/tasks/${task.id}`}>Open</Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </RelatedDataSection>
        </Stack>
      ) : null}

      {activeTab === 'movementTrace' ? (
        <RelatedDataSection
          title="Movement trace"
          description="Traceable stock movement chain connected through parent/root movement, transport order or transfer group."
          loading={traceQuery.isLoading}
          error={traceQuery.isError}
          onRetry={() => { void traceQuery.refetch(); }}
          empty={!traceQuery.isLoading && !traceQuery.isError && (traceQuery.data?.movements ?? []).length === 0}
          emptyTitle="No additional movements"
          emptyDescription="This movement is currently the only known item in its trace chain."
        >
          <Stack spacing={1.25}>
            {(traceQuery.data?.movements ?? []).map((item) => (
              <Stack
                key={item.id}
                spacing={0.75}
                sx={{
                  p: 1.5,
                  border: 1,
                  borderColor: item.id === movement.id ? 'primary.main' : 'divider',
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" fontWeight={800}>Movement #{item.id}</Typography>
                  <StatusChip value={item.movementType} />
                  <StatusChip value={item.status ?? 'EXECUTED'} variant="outlined" />
                  {item.id === movement.id ? <Chip size="small" label="Current" /> : null}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(item.createdAt)} · {item.warehouseName} · {item.productName} · quantity {item.quantity}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Source: {item.sourceType ?? item.referenceType ?? '—'}{item.sourceId ? ` #${item.sourceId}` : ''} · Parent: {item.parentMovementId ? `#${item.parentMovementId}` : '—'} · Root: {item.rootMovementId ? `#${item.rootMovementId}` : '—'} · Reversal: {item.reversalOfMovementId ? `of #${item.reversalOfMovementId}` : item.reversedByMovementId ? `by #${item.reversedByMovementId}` : '—'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button size="small" component={RouterLink} to={`/stock-movements/${item.id}`}>Open movement</Button>
                  <Button size="small" component={RouterLink} to={`/inventory/${item.warehouseId}/${item.productId}`}>Open inventory</Button>
                  {item.transportOrderId ? <Button size="small" component={RouterLink} to={`/transport-orders/${item.transportOrderId}`}>Open transport</Button> : null}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </RelatedDataSection>
      ) : null}

      {activeTab === 'activity' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <CommentsPanel entityType="STOCK_MOVEMENT" entityId={movement.id} allowCreate={canManageOperationalNotes} />
              <AttachmentsPanel
                entityType="STOCK_MOVEMENT"
                entityId={movement.id}
                allowCreate={canManageOperationalNotes}
                title="Movement evidence"
                description="Upload delivery notes, reports, damage photos and write-off/adjustment evidence connected with this stock movement."
                attachmentTypeOptions={stockMovementAttachmentTypeOptions}
                defaultAttachmentType="DELIVERY_NOTE"
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <DomainEventsPanel entityType="STOCK_MOVEMENT" entityId={movement.id} />
              <ChangeHistoryPanel entityName="STOCK_MOVEMENT" entityId={movement.id} />
            </Stack>
          </Grid>
        </Grid>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingActionDefinition)}
        title={pendingActionDefinition?.confirmTitle ?? 'Confirm lifecycle action'}
        description={pendingActionDefinition?.confirmDescription(movement) ?? ''}
        confirmText={pendingActionDefinition?.label ?? 'Confirm'}
        confirmColor={pendingActionDefinition?.color ?? 'primary'}
        isLoading={lifecycleActionPending}
        onClose={() => setPendingLifecycleAction(null)}
        onConfirm={() => {
          if (pendingLifecycleAction) {
            runLifecycleAction(pendingLifecycleAction);
          }
        }}
      />
    </EntityDetailsLayout>
  );
}
