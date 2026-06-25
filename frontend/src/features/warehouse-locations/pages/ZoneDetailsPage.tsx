import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Link, Stack, TablePagination, TextField, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildSortParam, type PageResponse } from '../../../core/api/pagination';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { warehouseLocationsApi } from '../api/warehouseLocationsApi';
import { useBinLocations, useInternalWarehouseMovements, useWarehouseZone } from '../hooks/useWarehouseLocations';
import type { BinLocationResponse, InternalWarehouseMovementResponse } from '../types/warehouseLocation.types';
import { warehouseLocationRoutes } from '../utils/warehouseLocationRoutes';

type TabKey = 'overview' | 'bins' | 'movement-trace' | 'change-history';

function toNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toNullableNumber(value: string) {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}


function CreateBinDialog({
  open,
  warehouseId,
  zoneId,
  zoneLabel,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  warehouseId: number;
  zoneId: number;
  zoneLabel: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { warehouseId: number; zoneId: number; code: string; name: string; capacity?: number | null; description?: string | null }) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  const resetAndClose = () => {
    if (loading) return;
    setCode('');
    setName('');
    setCapacity('');
    setDescription('');
    onClose();
  };

  const submitDisabled = code.trim().length === 0 || name.trim().length === 0;

  return (
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm">
      <DialogTitle>Create bin</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Location" value={zoneLabel} fullWidth disabled />
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} required fullWidth />
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <TextField label="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" fullWidth />
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={resetAndClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={submitDisabled || loading}
          onClick={() => {
            onSubmit({
              warehouseId,
              zoneId,
              code: code.trim(),
              name: name.trim(),
              capacity: toNullableNumber(capacity),
              description: description.trim() || null,
            });
            setCode('');
            setName('');
            setCapacity('');
            setDescription('');
          }}
        >
          {loading ? 'Creating...' : 'Create bin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function usePagedState(defaultSize = 10) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);
  const pagination = (data: PageResponse<unknown> | undefined) => (
    <TablePagination
      component="div"
      count={data?.totalElements ?? 0}
      page={data?.number ?? page}
      rowsPerPage={data?.size ?? size}
      rowsPerPageOptions={[5, 10, 20, 50]}
      onPageChange={(_, nextPage) => setPage(nextPage)}
      onRowsPerPageChange={(event) => { setPage(0); setSize(Number(event.target.value)); }}
    />
  );
  return { page, size, reset: () => setPage(0), pagination };
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function StatusChip({ active }: { active: boolean | undefined }) {
  return <Chip size="small" label={active ? 'ACTIVE' : 'INACTIVE'} color={active ? 'success' : 'default'} />;
}

export default function ZoneDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const { warehouseId: warehouseParam, zoneId: zoneParam } = useParams();
  const warehouseId = toNumber(warehouseParam);
  const zoneId = toNumber(zoneParam);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [binSearch, setBinSearch] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [createBinOpen, setCreateBinOpen] = useState(false);
  const binPage = usePagedState();
  const movementPage = usePagedState();

  const zoneQuery = useWarehouseZone(zoneId, Boolean(warehouseId && zoneId));
  const currentZone = zoneQuery.data ?? null;

  const binsEnabled = Boolean(warehouseId && zoneId && (activeTab === 'overview' || activeTab === 'bins'));
  const movementEnabled = Boolean(warehouseId && zoneId && activeTab === 'movement-trace');

  const binsQuery = useBinLocations({
    warehouseId,
    zoneId,
    search: activeTab === 'bins' ? binSearch.trim() || undefined : undefined,
    page: activeTab === 'bins' ? binPage.page : 0,
    size: activeTab === 'bins' ? binPage.size : 8,
    sort: buildSortParam({ field: 'code', direction: 'asc' }),
  }, binsEnabled);

  const movementsQuery = useInternalWarehouseMovements({
    warehouseId,
    zoneId,
    search: movementSearch.trim() || undefined,
    page: movementPage.page,
    size: movementPage.size,
    sort: 'createdAt,desc',
  }, movementEnabled);

  const createBinMutation = useMutation({
    mutationFn: warehouseLocationsApi.createBin,
    onSuccess: async () => {
      showSnackbar({ message: 'Bin created successfully.', severity: 'success' });
      setCreateBinOpen(false);
      setActiveTab('bins');
      await queryClient.invalidateQueries({ queryKey: ['warehouse-locations', 'bins'] });
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const binColumns: DataTableColumn<BinLocationResponse>[] = [
    { id: 'code', header: 'Bin', render: (row) => <Link component="button" fontWeight={800} onClick={() => navigate(warehouseLocationRoutes.binDetails(row.warehouseId, row.zoneId, row.id))}>{row.code}</Link> },
    { id: 'name', header: 'Label', render: (row) => row.name },
    { id: 'capacity', header: 'Capacity', align: 'right', render: (row) => formatNumber(row.capacity) },
    { id: 'active', header: 'Status', render: (row) => <StatusChip active={row.active} /> },
    { id: 'updatedAt', header: 'Updated', render: (row) => formatDate(row.updatedAt) },
  ];

  const movementColumns: DataTableColumn<InternalWarehouseMovementResponse>[] = [
    { id: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    { id: 'product', header: 'Product', render: (row) => (
      <Button size="small" component={RouterLink} to={warehouseLocationRoutes.productDetails(row.productId)}>{row.productName} ({row.sku})</Button>
    ) },
    { id: 'trace', header: 'Trace', render: (row) => (
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button size="small" component={RouterLink} to={warehouseLocationRoutes.binDetails(row.warehouseId, row.sourceBinZoneId, row.sourceBinId)}>{row.sourceBinCode}</Button>
        <Typography variant="body2" color="text.secondary">→</Typography>
        <Button size="small" component={RouterLink} to={warehouseLocationRoutes.binDetails(row.warehouseId, row.destinationBinZoneId, row.destinationBinId)}>{row.destinationBinCode}</Button>
      </Stack>
    ) },
    { id: 'quantity', header: 'Quantity', align: 'right', render: (row) => row.quantity },
    { id: 'status', header: 'Status', render: (row) => <Chip size="small" label={row.status} color={row.status === 'COMPLETED' ? 'success' : 'default'} /> },
  ];

  const tabs: { value: TabKey; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'bins', label: 'Bins' },
    { value: 'movement-trace', label: 'Recent movement trace' },
    { value: 'change-history', label: 'Change history' },
  ];

  if (!warehouseId || !zoneId) {
    return <Alert severity="error">Invalid warehouse location route.</Alert>;
  }

  return (
    <EntityDetailsLayout
      overline="Warehouse location"
      title={currentZone ? `${currentZone.code} · ${currentZone.name}` : `Location #${zoneId}`}
      description={currentZone?.warehouseName ?? `Warehouse #${warehouseId}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as TabKey)}
      actions={(
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to={warehouseLocationRoutes.warehouseDetails(warehouseId)} variant="outlined">Warehouse</Button>
          <Button variant="contained" onClick={() => setCreateBinOpen(true)}>Create bin</Button>
        </Stack>
      )}
    >
      {zoneQuery.isError ? <Alert severity="error">Location could not be loaded.</Alert> : null}

      {activeTab === 'overview' ? (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionCard title="Status"><StatusChip active={currentZone?.active} /></SectionCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionCard title="Type"><Typography variant="h6">{currentZone?.type ?? '—'}</Typography></SectionCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionCard title="Capacity"><Typography variant="h6">{formatNumber(currentZone?.capacity)}</Typography></SectionCard>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SectionCard title="Bins"><Typography variant="h6">{binsQuery.data?.totalElements ?? '—'}</Typography></SectionCard>
            </Grid>
          </Grid>

          <SectionCard title="Overview">
            <Grid container spacing={2}>
              {[
                ['Warehouse', currentZone?.warehouseName ?? `#${warehouseId}`],
                ['Code', currentZone?.code ?? `#${zoneId}`],
                ['Name', currentZone?.name ?? '—'],
                ['Description', currentZone?.description ?? '—'],
                ['Created', formatDate(currentZone?.createdAt)],
                ['Updated', formatDate(currentZone?.updatedAt)],
              ].map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
                  <Typography fontWeight={700}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          </SectionCard>

          <SectionCard
            title="Bins"
            action={(
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setCreateBinOpen(true)}>Create bin</Button>
                <Button size="small" onClick={() => setActiveTab('bins')}>View all bins</Button>
              </Stack>
            )}
          >
            <DataTable columns={binColumns} rows={binsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={binsQuery.isLoading} error={binsQuery.isError} onRetry={() => binsQuery.refetch()} />
          </SectionCard>
        </Stack>
      ) : null}

      {activeTab === 'bins' ? (
        <SectionCard title="Bins" action={<Button size="small" variant="outlined" onClick={() => setCreateBinOpen(true)}>Create bin</Button>}>
          <Stack spacing={2}>
            <TextField label="Search bin" value={binSearch} onChange={(event) => { setBinSearch(event.target.value); binPage.reset(); }} size="small" fullWidth />
            <DataTable columns={binColumns} rows={binsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={binsQuery.isLoading} error={binsQuery.isError} onRetry={() => binsQuery.refetch()} pagination={binPage.pagination(binsQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'movement-trace' ? (
        <SectionCard title="Recent movement trace">
          <Stack spacing={2}>
            <TextField label="Search movement" value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); movementPage.reset(); }} size="small" fullWidth />
            <DataTable columns={movementColumns} rows={movementsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={movementsQuery.isLoading} error={movementsQuery.isError} onRetry={() => movementsQuery.refetch()} pagination={movementPage.pagination(movementsQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'change-history' ? (
        <ChangeHistoryPanel
          entityName="WAREHOUSE_ZONE"
          entityId={zoneId}
          title="Change history"
        />
      ) : null}

      <CreateBinDialog
        open={createBinOpen}
        warehouseId={warehouseId}
        zoneId={zoneId}
        zoneLabel={currentZone ? `${currentZone.code} · ${currentZone.name}` : `Location #${zoneId}`}
        loading={createBinMutation.isPending}
        onClose={() => setCreateBinOpen(false)}
        onSubmit={(payload) => createBinMutation.mutate(payload)}
      />
    </EntityDetailsLayout>
  );
}
