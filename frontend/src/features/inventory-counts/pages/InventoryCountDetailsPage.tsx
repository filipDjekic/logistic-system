import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { lookupApi } from '../../lookup/api/lookupApi';
import { warehouseLocationsApi } from '../../warehouse-locations/api/warehouseLocationsApi';
import { inventoryCountsApi } from '../api/inventoryCountsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import type { InventoryCountLineResponse, InventoryCountSessionStatus } from '../types/inventoryCount.types';
import InventoryCountLifecycleTimeline from '../components/InventoryCountLifecycleTimeline';
import InventoryCountAuditPanel from '../components/InventoryCountAuditPanel';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import type { InventoryCountLineStatusFilter } from '../types/inventoryCount.types';

function DifferenceCell({ value }: { value: number }) {
  const label = value > 0 ? `+${value}` : `${value}`;
  const color = value === 0 ? 'default' : value > 0 ? 'success' : 'warning';
  return <Chip size="small" color={color} label={label} />;
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

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
  const canManageInventoryCount = userRole === ROLES.OVERLORD || userRole === ROLES.COMPANY_ADMIN || userRole === ROLES.WAREHOUSE_MANAGER;
  const canCountInventoryLines = canManageInventoryCount || userRole === ROLES.WORKER;
  const [editingLine, setEditingLine] = useState<InventoryCountLineResponse | null>(null);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [note, setNote] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [binFilter, setBinFilter] = useState('');
  const [search, setSearch] = useState('');
  const [lineStatusFilter, setLineStatusFilter] = useState<InventoryCountLineStatusFilter | ''>('');
  const [linesPage, setLinesPage] = useState(0);
  const [linesSize, setLinesSize] = useState(50);

  const query = useQuery({
    queryKey: queryKeys.inventoryCounts.detail(id),
    queryFn: () => inventoryCountsApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const session = query.data;

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
    enabled: Number.isFinite(id) && Boolean(session),
  });

  const mutableWarehousesQuery = useQuery({
    queryKey: ['warehouses', 'lookup', 'mutate', { sessionWarehouseId: session?.warehouseId }],
    queryFn: () => lookupApi.getOptions('warehouses', { accessMode: 'mutate', size: 1000 }),
    enabled: Boolean(session?.warehouseId) && !(userRole === ROLES.OVERLORD || userRole === ROLES.COMPANY_ADMIN),
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
    mutationFn: (action: 'start' | 'submitReview' | 'approve' | 'reject' | 'createAdjustments' | 'close' | 'cancel') => {
      if (action === 'start') return inventoryCountsApi.start(id);
      if (action === 'submitReview') return inventoryCountsApi.submitReview(id);
      if (action === 'approve') return inventoryCountsApi.approve(id);
      if (action === 'reject') return inventoryCountsApi.reject(id);
      if (action === 'createAdjustments') return inventoryCountsApi.createAdjustments(id);
      if (action === 'close') return inventoryCountsApi.close(id);
      return inventoryCountsApi.cancel(id);
    },
    onSuccess: () => {
      showSnackbar('Inventory count updated.', 'success');
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
      showSnackbar('Count line saved.', 'success');
      closeCountDialog();
      invalidate();
    },
  });

  const zones = zonesQuery.data?.content ?? [];
  const bins = binsQuery.data?.content ?? [];
  const allowed = (allowedTransitionsQuery.data?.allowedStatuses ?? []) as InventoryCountSessionStatus[];
  const canMutateSelectedWarehouse = Boolean(
    session && (
      userRole === ROLES.OVERLORD
      || userRole === ROLES.COMPANY_ADMIN
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

  return (
    <Stack spacing={2}>
      <PageHeader
        title={session ? `Inventory count ${session.code}` : 'Inventory count'}
        description={session ? `${session.warehouseName} • ${session.lineCount} bin/product lines • ${session.discrepancyLineCount} discrepancies` : undefined}
        actions={session ? (
          <>
            <Button component={RouterLink} to="/inventory-counts" variant="outlined">Back</Button>
            {allowed.includes('COUNTING') ? <Button variant="outlined" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('start')}>Start</Button> : null}
            {allowed.includes('REVIEW') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('submitReview')}>Submit review</Button> : null}
            {allowed.includes('APPROVED') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('approve')}>Approve</Button> : null}
            {allowed.includes('REJECTED') ? <Button color="warning" variant="outlined" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('reject')}>Reject</Button> : null}
            {allowed.includes('ADJUSTMENTS_CREATED') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('createAdjustments')}>Create adjustments</Button> : null}
            {allowed.includes('CLOSED') ? <Button variant="contained" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('close')}>Close</Button> : null}
            {allowed.includes('CANCELLED') ? <Button color="error" disabled={!canTriggerManagerAction} onClick={() => actionMutation.mutate('cancel')}>Cancel</Button> : null}
          </>
        ) : null}
      />
      {session ? (
        <>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                <Chip label={statusLabel(session.status)} />
                <Typography variant="body2" color="text.secondary">
                  Location-aware count: every line is tied to one product and one bin. Adjustments are created only after approval.
                </Typography>
              </Stack>
              <Divider />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}><Typography variant="caption" color="text.secondary">Progress</Typography><Typography variant="h6">{session.countedLineCount}/{session.lineCount} ({countedPercent}%)</Typography></Paper>
                <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}><Typography variant="caption" color="text.secondary">Discrepancy lines</Typography><Typography variant="h6">{session.discrepancyLineCount}</Typography></Paper>
                <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}><Typography variant="caption" color="text.secondary">Current page absolute delta</Typography><Typography variant="h6">{totalAbsoluteDifference}</Typography></Paper>
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Lifecycle</Typography>
              <Alert severity={canManageInventoryCount ? 'info' : canCountInventoryLines ? 'warning' : 'info'}>{roleHint}</Alert>
              <InventoryCountLifecycleTimeline session={session} allowedNextStatuses={allowed} />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Review by location</Typography>
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Bin</TableCell>
                    <TableCell align="right">System</TableCell>
                    <TableCell align="right">Counted</TableCell>
                    <TableCell align="right">Difference</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="right">Adjustment</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => {
                    const location = locationLabel(line);
                    return (
                      <TableRow key={line.id} hover>
                        <TableCell>{line.productName}<Typography variant="caption" color="text.secondary" display="block">{line.productSku}</Typography></TableCell>
                        <TableCell>{location.zone}</TableCell>
                        <TableCell>{location.bin}</TableCell>
                        <TableCell align="right">{line.systemQuantity}</TableCell>
                        <TableCell align="right">{line.countedQuantity ?? '-'}</TableCell>
                        <TableCell align="right"><DifferenceCell value={line.differenceQuantity ?? 0} /></TableCell>
                        <TableCell>{line.note ?? '-'}</TableCell>
                        <TableCell align="right">{line.adjustmentMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${line.adjustmentMovementId}`}>Open</Button> : '-'}</TableCell>
                        <TableCell align="right">
                          {canEditLines ? (
                            <Button size="small" onClick={() => { setEditingLine(line); setCountedQuantity(String(line.countedQuantity ?? line.systemQuantity ?? 0)); setNote(line.note ?? ''); }}>Count</Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!linesQuery.isFetching && lines.length === 0 ? (
                    <TableRow><TableCell colSpan={9}><Typography color="text.secondary">No count lines match selected filters.</Typography></TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <ServerTablePagination
                page={linesQuery.data}
                disabled={linesQuery.isFetching}
                onPageChange={setLinesPage}
                onSizeChange={(nextSize) => { setLinesSize(nextSize); setLinesPage(0); }}
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Audit</Typography>
              <InventoryCountAuditPanel sessionId={session.id} code={session.code} allowAttachmentsCreate={canMutateSelectedWarehouse} />
            </Stack>
          </Paper>
        </>
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
    </Stack>
  );
}
