import { useEffect, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DetailsLifecycleCard,
  DetailsMetadataCard,
  DetailsOverviewCard,
  DetailsStatisticsCard,
  EntityDetailsLayout,
  RelatedDataSection,
} from '../../../shared/components/EntityDetails';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import {
  canCountInventoryCountLines,
  canManageInventoryCountLifecycle,
  filterAllowedStatusesByRole,
  getAllowedInventoryCountLifecycleStatuses,
} from '../../../core/permissions/operationGuards';
import { queryKeys } from '../../../core/constants/queryKeys';
import { lookupApi } from '../../lookup/api/lookupApi';
import { warehouseLocationsApi } from '../../warehouse-locations/api/warehouseLocationsApi';
import { inventoryCountsApi } from '../api/inventoryCountsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import type { InventoryCountLineResponse, InventoryCountSessionStatus } from '../types/inventoryCount.types';
import InventoryCountLifecycleTimeline from '../components/InventoryCountLifecycleTimeline';
import InventoryCountAuditPanel from '../components/InventoryCountAuditPanel';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { InventoryCountLineStatusFilter } from '../types/inventoryCount.types';

type InventoryCountDetailsTab = 'overview' | 'lines' | 'lifecycle' | 'audit';

function DifferenceCell({ value }: { value: number }) {
  const label = value > 0 ? `+${value}` : `${value}`;
  const color = value === 0 ? 'default' : value > 0 ? 'success' : 'warning';
  return <Chip size="small" color={color} label={label} />;
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}


const inventoryCountLifecycleOrder: InventoryCountSessionStatus[] = [
  'DRAFT',
  'OPEN',
  'COUNTING',
  'REVIEW',
  'APPROVED',
  'ADJUSTMENTS_CREATED',
  'CLOSED',
];

const inventoryCountTerminalStatuses: InventoryCountSessionStatus[] = ['CLOSED', 'REJECTED', 'CANCELLED'];

function locationLabel(line: InventoryCountLineResponse) {
  const zone = line.warehouseZoneCode ? `${line.warehouseZoneCode}${line.warehouseZoneName ? ` · ${line.warehouseZoneName}` : ''}` : 'No zone';
  const bin = line.binLocationCode ? `${line.binLocationCode}${line.binLocationName ? ` · ${line.binLocationName}` : ''}` : 'No bin';
  return { zone, bin };
}

export default function InventoryCountDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const auth = useAuthStore();
  const userRole = auth.user?.role ?? null;
  const isWorkerInventoryCounter = userRole === ROLES.WORKER;
  const canManageInventoryCount = canManageInventoryCountLifecycle(userRole);
  const canCountInventoryLines = canCountInventoryCountLines(userRole);
  const [editingLine, setEditingLine] = useState<InventoryCountLineResponse | null>(null);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [note, setNote] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [binFilter, setBinFilter] = useState('');
  const [search, setSearch] = useState('');
  const [lineStatusFilter, setLineStatusFilter] = useState<InventoryCountLineStatusFilter | ''>('');
  const [linesPage, setLinesPage] = useState(0);
  const [linesSize, setLinesSize] = useState(50);
  const [activeTab, setActiveTab] = useState<InventoryCountDetailsTab>(isWorkerInventoryCounter ? 'lines' : 'overview');

  const query = useQuery({
    queryKey: queryKeys.inventoryCounts.detail(id),
    queryFn: () => inventoryCountsApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const session = query.data;

  useEffect(() => {
    if (isWorkerInventoryCounter && activeTab !== 'lines') {
      setActiveTab('lines');
    }
  }, [activeTab, isWorkerInventoryCounter]);

  const linesQuery = useQuery({
    queryKey: [...queryKeys.inventoryCounts.detail(id), 'lines', { page: linesPage, size: linesSize, search, zoneFilter, binFilter, lineStatusFilter }],
    queryFn: () => inventoryCountsApi.getLines(id, {
      page: linesPage,
      size: linesSize,
      sort: 'product.name,asc',
      search: search.trim() || undefined,
      zoneId: zoneFilter ? Number(zoneFilter) : undefined,
      binLocationId: binFilter ? Number(binFilter) : undefined,
      status: lineStatusFilter || undefined,
    }),
    enabled: Number.isFinite(id) && Boolean(session),
    placeholderData: (previousData) => previousData,
  });

  const allowedTransitionsQuery = useQuery({
    queryKey: [...queryKeys.inventoryCounts.detail(id), 'allowed-transitions'],
    queryFn: () => inventoryCountsApi.allowedStatusTransitions(id),
    enabled: Number.isFinite(id) && Boolean(session) && canManageInventoryCount,
  });

  const mutableWarehousesQuery = useQuery({
    queryKey: ['warehouses', 'lookup', 'mutate', { sessionWarehouseId: session?.warehouseId }],
    queryFn: () => lookupApi.getOptions('warehouses', { accessMode: 'mutate', size: 1000 }),
    enabled: Boolean(session?.warehouseId) && userRole !== ROLES.OVERLORD,
    staleTime: 60_000,
  });

  const zonesQuery = useQuery({
    queryKey: ['warehouse-locations', 'zones', { warehouseId: session?.warehouseId }],
    queryFn: () => warehouseLocationsApi.zones({ warehouseId: session!.warehouseId, size: 500 }),
    enabled: Boolean(session?.warehouseId),
    staleTime: 30_000,
  });

  const binsQuery = useQuery({
    queryKey: ['warehouse-locations', 'bins', { warehouseId: session?.warehouseId, zoneId: zoneFilter || undefined }],
    queryFn: () => warehouseLocationsApi.bins({ warehouseId: session!.warehouseId, zoneId: zoneFilter ? Number(zoneFilter) : undefined, size: 1000 }),
    enabled: Boolean(session?.warehouseId),
    staleTime: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.root() });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.detail(id) });
    queryClient.invalidateQueries({ queryKey: [...queryKeys.inventoryCounts.detail(id), 'lines'] });
  };

  const actionMutation = useMutation({
    mutationFn: (action: 'open' | 'start' | 'submitReview' | 'approve' | 'reject' | 'createAdjustments' | 'close' | 'cancel') => {
      if (action === 'open') return inventoryCountsApi.open(id);
      if (action === 'start') return inventoryCountsApi.start(id);
      if (action === 'submitReview') return inventoryCountsApi.submitReview(id);
      if (action === 'approve') return inventoryCountsApi.approve(id);
      if (action === 'reject') return inventoryCountsApi.reject(id);
      if (action === 'createAdjustments') return inventoryCountsApi.createAdjustments(id);
      if (action === 'close') return inventoryCountsApi.close(id);
      return inventoryCountsApi.cancel(id);
    },
    onSuccess: () => {
      showSnackbar({ message: 'Inventory count updated.', severity: 'success' });
      invalidate();
    },
  });

  const updateLineMutation = useMutation({
    mutationFn: () => inventoryCountsApi.updateLine(id, editingLine!.id, {
      binLocationId: editingLine?.binLocationId ?? null,
      countedQuantity: Number(countedQuantity),
      note,
    }),
    onSuccess: () => {
      showSnackbar({ message: 'Count line saved.', severity: 'success' });
      closeCountDialog();
      invalidate();
    },
  });

  const zones = zonesQuery.data?.content ?? [];
  const bins = binsQuery.data?.content ?? [];
  const allowed = filterAllowedStatusesByRole(
    allowedTransitionsQuery.data?.allowedStatuses as InventoryCountSessionStatus[] | undefined,
    getAllowedInventoryCountLifecycleStatuses(userRole),
  );
  const canMutateSelectedWarehouse = Boolean(
    session && (
      userRole === ROLES.OVERLORD
      || (mutableWarehousesQuery.data?.content ?? []).some((warehouse) => warehouse.id === session.warehouseId)
    )
  );
  const canEditLines = session?.status === 'COUNTING' && canCountInventoryLines && canMutateSelectedWarehouse;

  const lines = linesQuery.data?.content ?? [];

  const closeCountDialog = () => {
    if (updateLineMutation.isPending) return;
    setEditingLine(null);
    setCountedQuantity('');
    setNote('');
  };

  const countedPercent = session?.lineCount ? Math.round((session.countedLineCount / session.lineCount) * 100) : 0;
  const totalAbsoluteDifference = lines.reduce((sum, line) => sum + Math.abs(Number(line.differenceQuantity ?? 0)), 0);
  const roleHint = canMutateSelectedWarehouse && canManageInventoryCount
    ? 'Your role can manage this inventory count when backend status rules allow it.'
    : canMutateSelectedWarehouse && canCountInventoryLines
      ? 'Your role can enter counted quantities during COUNTING. Review and approval actions stay with warehouse managers/admins.'
      : 'You can view this inventory count, but cannot mutate count lines or lifecycle status for this warehouse.';
  const canTriggerManagerAction = canManageInventoryCount && canMutateSelectedWarehouse && !actionMutation.isPending;

  const tabs: { value: InventoryCountDetailsTab; label: string }[] = isWorkerInventoryCounter
    ? [{ value: 'lines', label: session ? `Count lines (${session.lineCount})` : 'Count lines' }]
    : [
        { value: 'overview', label: 'Overview' },
        { value: 'lines', label: session ? `Count lines (${session.lineCount})` : 'Count lines' },
        { value: 'lifecycle', label: 'Lifecycle' },
        { value: 'audit', label: 'Audit' },
      ];

  return (
    <EntityDetailsLayout
      overline="Inventory"
      title={session ? `Inventory count ${session.code}` : 'Inventory count'}
      description={session ? `${session.warehouseName} • ${session.lineCount} bin/product lines • ${session.discrepancyLineCount} discrepancies` : 'Location-aware warehouse inventory count session.'}
      loading={query.isLoading}
      loadingText="Loading inventory count..."
      error={!Number.isFinite(id) ? 'Invalid inventory count ID.' : query.isError ? query.error : undefined}
      errorTitle={!Number.isFinite(id) ? 'Invalid inventory count' : 'Inventory count could not be loaded'}
      onRetry={() => { void query.refetch(); }}
      tabs={session ? tabs : undefined}
      activeTab={session ? activeTab : undefined}
      onTabChange={session ? (value) => setActiveTab(value as InventoryCountDetailsTab) : undefined}
      actions={session ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button component={RouterLink} to="/inventory-counts" variant="outlined">Back</Button>
          {canManageInventoryCount && allowed.includes('OPEN') ? <Button variant="outlined" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('open')}>Open</Button> : null}
          {canManageInventoryCount && allowed.includes('COUNTING') ? <Button variant="outlined" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('start')}>Start</Button> : null}
          {canManageInventoryCount && allowed.includes('REVIEW') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('submitReview')}>Submit review</Button> : null}
          {canManageInventoryCount && allowed.includes('APPROVED') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('approve')}>Approve</Button> : null}
          {canManageInventoryCount && allowed.includes('REJECTED') ? <Button color="warning" variant="outlined" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('reject')}>Reject</Button> : null}
          {canManageInventoryCount && allowed.includes('ADJUSTMENTS_CREATED') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('createAdjustments')}>Create adjustments</Button> : null}
          {canManageInventoryCount && allowed.includes('CLOSED') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('close')}>Close</Button> : null}
          {canManageInventoryCount && allowed.includes('CANCELLED') ? <Button color="error" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('cancel')}>Cancel</Button> : null}
        </Stack>
      ) : null}
    >
      {session && activeTab === 'overview' ? (
        <Stack spacing={3}>
          <DetailsStatisticsCard
            title="Count progress"
            description="Current inventory count progress and discrepancy summary."
            statistics={[
              { key: 'progress', title: 'Progress', value: `${session.countedLineCount}/${session.lineCount}`, subtitle: `${countedPercent}% counted`, progress: countedPercent },
              { key: 'discrepancies', title: 'Discrepancy lines', value: session.discrepancyLineCount, subtitle: 'Lines requiring review' },
              { key: 'pageDelta', title: 'Current page delta', value: totalAbsoluteDifference, subtitle: 'Absolute quantity difference' },
            ]}
          />

          <DetailsOverviewCard
            title="Inventory count overview"
            description="Session identity, warehouse scope and current status."
            fields={[
              { key: 'status', label: 'Status', value: <Chip label={statusLabel(session.status)} /> },
              { key: 'code', label: 'Code', value: session.code },
              { key: 'warehouse', label: 'Warehouse', value: <Button size="small" component={RouterLink} to={`/warehouses/${session.warehouseId}`}>{session.warehouseName}</Button> },
              { key: 'lines', label: 'Lines', value: session.lineCount },
              { key: 'counted', label: 'Counted lines', value: session.countedLineCount },
              { key: 'discrepancy', label: 'Discrepancy lines', value: session.discrepancyLineCount },
            ]}
          />

          <DetailsMetadataCard
            title="Operational metadata"
            description="Rules and access context for this count session."
            fields={[
              { key: 'locationAware', label: 'Location-aware count', value: 'Every line is tied to one product and one bin.' },
              { key: 'adjustments', label: 'Adjustments', value: 'Created only after approval.' },
              { key: 'permissions', label: 'Current access', value: roleHint, size: { xs: 12 } },
            ]}
          />
        </Stack>
      ) : null}

      {session && activeTab === 'lines' ? (
        <RelatedDataSection
          title="Inventory count lines"
          description="Location-aware product/bin lines for this count session."
          loading={linesQuery.isLoading || linesQuery.isFetching}
          error={linesQuery.isError}
          onRetry={() => { void linesQuery.refetch(); }}
          empty={!linesQuery.isLoading && !linesQuery.isFetching && !linesQuery.isError && lines.length === 0}
          emptyTitle="No count lines"
          emptyDescription="No count lines match selected filters."
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Search product/bin" value={search} onChange={(event) => { setSearch(event.target.value); setLinesPage(0); }} fullWidth />
              <TextField select label="Zone" value={zoneFilter} onChange={(event) => { setZoneFilter(event.target.value); setBinFilter(''); setLinesPage(0); }} fullWidth>
                <MenuItem value="">All zones</MenuItem>
                {zones.map((zone) => <MenuItem key={zone.id} value={zone.id}>{zone.code} · {zone.name}</MenuItem>)}
              </TextField>
              <TextField select label="Bin" value={binFilter} onChange={(event) => { setBinFilter(event.target.value); setLinesPage(0); }} fullWidth>
                <MenuItem value="">All bins</MenuItem>
                {bins.map((bin) => <MenuItem key={bin.id} value={bin.id}>{bin.code} · {bin.name}</MenuItem>)}
              </TextField>
              <TextField select label="Line status" value={lineStatusFilter} onChange={(event) => { setLineStatusFilter(event.target.value as InventoryCountLineStatusFilter | ''); setLinesPage(0); }} fullWidth>
                <MenuItem value="">All lines</MenuItem>
                <MenuItem value="UNCOUNTED">Uncounted</MenuItem>
                <MenuItem value="COUNTED">Counted</MenuItem>
                <MenuItem value="DISCREPANCY">Discrepancy</MenuItem>
                <MenuItem value="MATCHED">Matched</MenuItem>
                <MenuItem value="ADJUSTED">Adjusted</MenuItem>
              </TextField>
            </Stack>
            <DataTable<InventoryCountLineResponse>
              columns={[
                {
                  id: 'product',
                  header: 'Product',
                  render: (line) => (
                    <>
                      {line.productName}
                      <Typography variant="caption" color="text.secondary" display="block">{line.productSku}</Typography>
                    </>
                  ),
                },
                { id: 'zone', header: 'Zone', render: (line) => locationLabel(line).zone },
                { id: 'bin', header: 'Bin', render: (line) => locationLabel(line).bin },
                { id: 'systemQuantity', header: 'System', align: 'right', accessor: 'systemQuantity' },
                { id: 'countedQuantity', header: 'Counted', align: 'right', render: (line) => line.countedQuantity ?? '-' },
                { id: 'difference', header: 'Difference', align: 'right', render: (line) => <DifferenceCell value={line.differenceQuantity ?? 0} /> },
                { id: 'note', header: 'Note', render: (line) => line.note ?? '-' },
                { id: 'adjustment', header: 'Adjustment', align: 'right', render: (line) => line.adjustmentMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${line.adjustmentMovementId}`}>Open</Button> : '-' },
                { id: 'actions', header: '', align: 'right', render: (line) => canEditLines ? <Button size="small" onClick={() => { setEditingLine(line); setCountedQuantity(String(line.countedQuantity ?? line.systemQuantity ?? 0)); setNote(line.note ?? ''); }}>Count</Button> : null },
              ]}
              rows={lines}
              getRowId={(line) => line.id}
              size="small"
              minWidth={1040}
              emptyTitle="No count lines"
              emptyDescription="No inventory count lines match the current filters."
            />
            <ServerTablePagination
              page={linesQuery.data}
              disabled={linesQuery.isFetching}
              onPageChange={setLinesPage}
              onSizeChange={(nextSize) => { setLinesSize(nextSize); setLinesPage(0); }}
            />
          </Stack>
        </RelatedDataSection>
      ) : null}

      {session && activeTab === 'lifecycle' ? (
        <DetailsLifecycleCard
          title="Lifecycle"
          description="Backend-controlled status workflow for this inventory count."
          currentStatus={session.status}
          statuses={session.status === 'REJECTED' || session.status === 'CANCELLED'
            ? ['DRAFT', 'OPEN', 'COUNTING', 'REVIEW', session.status]
            : inventoryCountLifecycleOrder}
          allowedNextStatuses={allowed}
          terminalStatuses={inventoryCountTerminalStatuses}
          info={canManageInventoryCount ? roleHint : undefined}
          warning={!canManageInventoryCount && canCountInventoryLines ? roleHint : undefined}
        >
          <InventoryCountLifecycleTimeline session={session} allowedNextStatuses={allowed} />
        </DetailsLifecycleCard>
      ) : null}

      {session && activeTab === 'audit' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <InventoryCountAuditPanel sessionId={session.id} code={session.code} allowAttachmentsCreate={canMutateSelectedWarehouse} />
          </Grid>
        </Grid>
      ) : null}

      <Dialog open={Boolean(editingLine)} onClose={closeCountDialog} fullWidth maxWidth="sm">
        <DialogTitle>Count {editingLine?.productName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editingLine ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {editingLine.productSku} • {locationLabel(editingLine).zone} / {locationLabel(editingLine).bin}
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Typography variant="body2" color="text.secondary">System quantity: <strong>{editingLine.systemQuantity}</strong></Typography>
                    <Typography variant="body2" color="text.secondary">Current counted: <strong>{editingLine.countedQuantity ?? '-'}</strong></Typography>
                  </Stack>
                </Paper>
              </>
            ) : null}
            <TextField
              label="Counted quantity"
              type="number"
              value={countedQuantity}
              onChange={(event) => setCountedQuantity(event.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCountDialog} disabled={updateLineMutation.isPending}>Cancel</Button>
          <Button variant="contained" disabled={!editingLine || countedQuantity === '' || updateLineMutation.isPending} onClick={() => updateLineMutation.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>
    </EntityDetailsLayout>
  );
}
