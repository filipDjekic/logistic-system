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
import { useQuery } from '@tanstack/react-query';
import { buildSortParam } from '../../../core/api/pagination';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import { useTasks } from '../../tasks/hooks/useTasks';
import { stockMovementsApi } from '../api/stockMovementsApi';

type StockMovementDetailsTab =
  | 'overview'
  | 'inventoryImpact'
  | 'relatedProcess'
  | 'lifecycleTrace'
  | 'commentsAttachments'
  | 'domainEvents'
  | 'changeHistory';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
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

function getMovementDirection(movementType: string) {
  if (movementType.includes('IN') || movementType === 'ADJUSTMENT' || movementType === 'RETURN_IN') {
    return 'Inventory increase / reconciliation';
  }

  if (movementType.includes('OUT') || movementType === 'WRITE_OFF' || movementType === 'RETURN_OUT') {
    return 'Inventory decrease / consumption';
  }

  return 'Inventory lifecycle event';
}

export default function StockMovementDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const movementId = Number(params.id);
  const validMovementId = Number.isInteger(movementId) && movementId > 0 ? movementId : null;
  const [activeTab, setActiveTab] = useState<StockMovementDetailsTab>('overview');

  const stockMovementQuery = useQuery({
    queryKey: validMovementId ? queryKeys.stockMovements.detail(validMovementId) : ['stock-movements', 'details', 'invalid'],
    queryFn: () => stockMovementsApi.getById(validMovementId as number),
    enabled: Boolean(validMovementId),
  });

  const traceQuery = useQuery({
    queryKey: validMovementId ? queryKeys.stockMovements.trace(validMovementId) : ['stock-movements', 'trace', 'invalid'],
    queryFn: () => stockMovementsApi.trace(validMovementId as number),
    enabled: Boolean(validMovementId) && activeTab === 'lifecycleTrace',
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
    Boolean(validMovementId) && activeTab === 'relatedProcess',
  );

  const movement = stockMovementQuery.data;
  const canManageOperationalNotes =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

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

  const stockMovementRecommendedStep = (() => {
    if (movement.transportOrderId) {
      return {
        title: 'Review the transport order that caused this movement.',
        description: 'This stock movement is linked to transport execution. Open the related process to verify reservation, dispatch or delivery context.',
        severity: 'info' as const,
        actions: [
          { label: 'Open related process', onClick: () => setActiveTab('relatedProcess') },
          { label: 'Open inventory record', to: `/inventory/${movement.warehouseId}/${movement.productId}`, variant: 'outlined' as const },
        ],
      };
    }

    if (movement.parentMovementId || movement.rootMovementId) {
      return {
        title: 'Review lifecycle trace for the movement chain.',
        description: 'This movement belongs to a movement chain. Use lifecycle trace to see parent/root movement context and related inventory impact.',
        severity: 'info' as const,
        actions: [{ label: 'Open lifecycle trace', onClick: () => setActiveTab('lifecycleTrace') }],
      };
    }

    return {
      title: 'Verify inventory impact and references.',
      description: 'Open inventory impact to confirm how this movement changed warehouse/bin quantity, then review references if a process link is expected.',
      severity: 'info' as const,
      actions: [
        { label: 'Open inventory impact', onClick: () => setActiveTab('inventoryImpact') },
        { label: 'Open inventory record', to: `/inventory/${movement.warehouseId}/${movement.productId}`, variant: 'outlined' as const },
      ],
    };
  })();

  const tabs: { value: StockMovementDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'inventoryImpact', label: 'Inventory impact' },
    { value: 'relatedProcess', label: `Related process${relatedTasksQuery.data ? ` (${relatedTasksQuery.data.totalElements})` : ''}` },
    { value: 'lifecycleTrace', label: `Lifecycle trace${traceQuery.data ? ` (${traceQuery.data.movements.length})` : ''}` },
    { value: 'commentsAttachments', label: 'Comments & attachments' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Inventory"
      title={`Stock movement #${movement.id}`}
      description={`${movement.movementType} • ${movement.warehouseName} • ${movement.productName}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as StockMovementDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/inventory/${movement.warehouseId}/${movement.productId}`}
          >
            Open inventory record
          </Button>
          <Button variant="outlined" onClick={() => navigate('/stock-movements')}>
            Back to list
          </Button>
        </Stack>
      }
    >
      <RecommendedNextStep {...stockMovementRecommendedStep} />

      {activeTab === 'overview' ? (
        <Stack spacing={3}>
          <SectionCard title="Movement overview" description="Business identity and source context for this stock movement.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary">Movement type</Typography>
                  <StatusChip value={movement.movementType} />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Movement ID" value={movement.id} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Created at" value={formatDateTime(movement.createdAt)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Warehouse" value={<Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}`}>{movement.warehouseName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Product" value={<Button size="small" component={RouterLink} to={`/products/${movement.productId}`}>{movement.productName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Quantity" value={movement.quantity} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Adjustment direction" value={movement.adjustmentDirection ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reason code" value={movement.reasonCode ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reason description" value={movement.reasonDescription ?? '—'} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Reference" description="External or operational reference connected with the stock movement.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference type" value={movement.referenceType ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference ID" value={movement.referenceId ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference code" value={movement.referenceCode ?? movement.referenceNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Source" value={movement.sourceType ? `${movement.sourceType}${movement.sourceId ? ` #${movement.sourceId}` : ''}` : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Parent movement" value={movement.parentMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${movement.parentMovementId}`}>#{movement.parentMovementId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Root movement" value={movement.rootMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${movement.rootMovementId}`}>#{movement.rootMovementId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference number" value={movement.referenceNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Reference note" value={movement.referenceNote ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Transfer group" value={movement.transferGroupId ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Transport order" value={movement.transportOrderId ? <Button size="small" component={RouterLink} to={`/transport-orders/${movement.transportOrderId}`}>#{movement.transportOrderId}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Source bin" value={movement.sourceBinId ? <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.sourceBinZoneId, movement.sourceBinId)}>{movement.sourceBinCode ?? `#${movement.sourceBinId}`}</Button> : '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Destination bin" value={movement.destinationBinId ? <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.destinationBinZoneId, movement.destinationBinId)}>{movement.destinationBinCode ?? `#${movement.destinationBinId}`}</Button> : '—'} /></Grid>
            </Grid>
          </SectionCard>
        </Stack>
      ) : null}

      {activeTab === 'inventoryImpact' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <SectionCard title="Inventory impact" description="Quantity, reserved and available balance before and after this movement.">
              <Stack spacing={2}>
                <Alert severity="info">{getMovementDirection(movement.movementType)}</Alert>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Quantity before" value={movement.quantityBefore} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Quantity after" value={movement.quantityAfter} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Reserved before" value={formatOptionalNumber(movement.reservedBefore)} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Reserved after" value={formatOptionalNumber(movement.reservedAfter)} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Available before" value={formatOptionalNumber(movement.availableBefore)} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Available after" value={formatOptionalNumber(movement.availableAfter)} /></Grid>
                </Grid>
              </Stack>
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <SectionCard title="Linked inventory context" description="Direct navigation to the affected warehouse, product and inventory record.">
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" component={RouterLink} to={`/warehouses/${movement.warehouseId}`}>
                  Open warehouse
                </Button>
                <Button variant="outlined" component={RouterLink} to={`/products/${movement.productId}`}>
                  Open product
                </Button>
                <Button variant="contained" component={RouterLink} to={`/inventory/${movement.warehouseId}/${movement.productId}`}>
                  Open inventory record
                </Button>
                {movement.sourceBinId ? (
                  <Button variant="outlined" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.sourceBinZoneId, movement.sourceBinId)}>
                    Open source bin
                  </Button>
                ) : null}
                {movement.destinationBinId ? (
                  <Button variant="outlined" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.destinationBinZoneId, movement.destinationBinId)}>
                    Open destination bin
                  </Button>
                ) : null}
              </Stack>
            </SectionCard>
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'relatedProcess' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <RelatedDataSection
              title="Linked transport"
              description="Transport order connected with this stock movement, when the movement was created from transport flow."
              empty={!movement.transportOrderId}
              emptyTitle="No linked transport order"
              emptyDescription="This stock movement is not linked with a transport order."
            >
              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">Transport order ID</Typography>
                <Typography variant="h6">#{movement.transportOrderId}</Typography>
                {movement.transportOrderId ? (
                  <Button variant="outlined" component={RouterLink} to={`/transport-orders/${movement.transportOrderId}`} sx={{ alignSelf: 'flex-start' }}>
                    Open transport order
                  </Button>
                ) : null}
              </Stack>
            </RelatedDataSection>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
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
          </Grid>
        </Grid>
      ) : null}


      {activeTab === 'lifecycleTrace' ? (
        <RelatedDataSection
          title="Lifecycle trace"
          description="Traceable movement chain connected through parent/root movement, transport order or transfer group."
          loading={traceQuery.isLoading}
          error={traceQuery.isError}
          onRetry={() => { void traceQuery.refetch(); }}
          empty={!traceQuery.isLoading && !traceQuery.isError && (traceQuery.data?.movements ?? []).length === 0}
          emptyTitle="No additional lifecycle movements"
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
                  {item.id === movement.id ? <Chip size="small" label="Current" /> : null}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(item.createdAt)} · {item.warehouseName} · {item.productName} · quantity {item.quantity}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Source: {item.sourceType ?? item.referenceType ?? '—'}{item.sourceId ? ` #${item.sourceId}` : ''} · Parent: {item.parentMovementId ? `#${item.parentMovementId}` : '—'} · Root: {item.rootMovementId ? `#${item.rootMovementId}` : '—'}
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

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <CommentsPanel entityType="STOCK_MOVEMENT" entityId={movement.id} allowCreate={canManageOperationalNotes} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AttachmentsPanel entityType="STOCK_MOVEMENT" entityId={movement.id} allowCreate={canManageOperationalNotes} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'domainEvents' ? (
        <DomainEventsPanel entityType="STOCK_MOVEMENT" entityId={movement.id} />
      ) : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel entityName="STOCK_MOVEMENT" entityId={movement.id} />
      ) : null}
    </EntityDetailsLayout>
  );
}
