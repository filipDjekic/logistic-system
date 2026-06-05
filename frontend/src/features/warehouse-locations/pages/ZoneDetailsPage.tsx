import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Chip, Grid, Link, Stack, TablePagination, TextField, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import WarehouseStorageFlowGuide from '../components/WarehouseStorageFlowGuide';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import { buildSortParam, type PageResponse } from '../../../core/api/pagination';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import { useBinLocations, useInternalWarehouseMovements, useWarehouseZone } from '../hooks/useWarehouseLocations';
import type { BinLocationResponse, InternalWarehouseMovementResponse } from '../types/warehouseLocation.types';

type TabKey = 'overview' | 'bins' | 'internal-movements' | 'change-history';

function toNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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

export default function ZoneDetailsPage() {
  const navigate = useNavigate();
  const { warehouseId: warehouseParam, zoneId: zoneParam } = useParams();
  const warehouseId = toNumber(warehouseParam);
  const zoneId = toNumber(zoneParam);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [binSearch, setBinSearch] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const binPage = usePagedState();
  const movementPage = usePagedState();

  const zoneQuery = useWarehouseZone(zoneId, Boolean(warehouseId && zoneId));
  const currentZone = zoneQuery.data ?? null;

  const binsQuery = useBinLocations({
    warehouseId,
    zoneId,
    search: binSearch.trim() || undefined,
    page: binPage.page,
    size: binPage.size,
    sort: buildSortParam({ field: 'code', direction: 'asc' }),
  }, Boolean(warehouseId && zoneId));

  const movementsQuery = useInternalWarehouseMovements({
    warehouseId,
    zoneId,
    search: movementSearch.trim() || undefined,
    page: movementPage.page,
    size: movementPage.size,
    sort: 'createdAt,desc',
  }, Boolean(warehouseId && zoneId));


  const binColumns: DataTableColumn<BinLocationResponse>[] = [
    { id: 'code', header: 'Bin', render: (row) => <Link component="button" fontWeight={800} onClick={() => navigate(`/warehouses/${row.warehouseId}/zones/${row.zoneId}/bins/${row.id}`)}>{row.code}</Link> },
    { id: 'name', header: 'Label', render: (row) => row.name },
    { id: 'capacity', header: 'Capacity', align: 'right', render: (row) => row.capacity ?? '—' },
    { id: 'active', header: 'Status', render: (row) => <Chip size="small" label={row.active ? 'ACTIVE' : 'INACTIVE'} color={row.active ? 'success' : 'default'} /> },
    { id: 'updatedAt', header: 'Updated', render: (row) => formatDate(row.updatedAt) },
  ];

  const movementColumns: DataTableColumn<InternalWarehouseMovementResponse>[] = [
    { id: 'product', header: 'Product', render: (row) => `${row.productName} (${row.sku})` },
    { id: 'trace', header: 'Trace', render: (row) => (
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button size="small" component={RouterLink} to={`/warehouses/${row.warehouseId}/zones/${row.sourceBinZoneId}/bins/${row.sourceBinId}`}>{row.sourceBinCode}</Button>
        <Typography variant="body2" color="text.secondary">→</Typography>
        <Button size="small" component={RouterLink} to={`/warehouses/${row.warehouseId}/zones/${row.destinationBinZoneId}/bins/${row.destinationBinId}`}>{row.destinationBinCode}</Button>
      </Stack>
    ) },
    { id: 'quantity', header: 'Quantity', align: 'right', render: (row) => row.quantity },
    { id: 'status', header: 'Status', render: (row) => <Chip size="small" label={row.status} /> },
    { id: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
  ];


  const tabs: { value: TabKey; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'bins', label: 'Bins' },
    { value: 'internal-movements', label: 'Internal movements' },
    { value: 'change-history', label: 'Change history' },
  ];

  if (!warehouseId || !zoneId) {
    return <Alert severity="error">Invalid warehouse zone route.</Alert>;
  }

  return (
    <EntityDetailsLayout
      overline="Warehouse zone"
      title={currentZone ? `${currentZone.code} · ${currentZone.name}` : `Zone #${zoneId}`}
      description="Zone details are split into overview, scoped bins, internal movements and change history."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as TabKey)}
      actions={<Button component={RouterLink} to={`/warehouses/${warehouseId}/zones`} variant="outlined">Back to zones</Button>}
    >
      <WarehouseStorageFlowGuide warehouseId={warehouseId} zoneId={zoneId} compact />

      {activeTab === 'overview' ? (
        <SectionCard title="Overview" description="Core warehouse zone attributes.">
          <Grid container spacing={2}>
            {[
              ['Warehouse', currentZone?.warehouseName ?? `#${warehouseId}`],
              ['Code', currentZone?.code ?? `#${zoneId}`],
              ['Name', currentZone?.name ?? '—'],
              ['Type', currentZone?.type ?? '—'],
              ['Capacity', currentZone?.capacity ?? '—'],
              ['Status', currentZone?.active ? 'ACTIVE' : 'INACTIVE'],
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
      ) : null}

      {activeTab === 'bins' ? (
        <SectionCard title="Bins" description="Bins scoped to this zone. Clicking a row opens bin details.">
          <Stack spacing={2}>
            <TextField label="Search code/label" value={binSearch} onChange={(event) => { setBinSearch(event.target.value); binPage.reset(); }} size="small" fullWidth />
            <DataTable columns={binColumns} rows={binsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={binsQuery.isLoading} error={binsQuery.isError} onRetry={() => binsQuery.refetch()} pagination={binPage.pagination(binsQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'internal-movements' ? (
        <SectionCard title="Internal movements" description="Bin-to-bin movement trace scoped to this zone.">
          <Stack spacing={2}>
            <TextField label="Search product/SKU/bin/note" value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); movementPage.reset(); }} size="small" fullWidth />
            <DataTable columns={movementColumns} rows={movementsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={movementsQuery.isLoading} error={movementsQuery.isError} onRetry={() => movementsQuery.refetch()} pagination={movementPage.pagination(movementsQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'change-history' ? (
        <ChangeHistoryPanel
          entityName="WAREHOUSE_ZONE"
          entityId={zoneId}
          title="Zone change history"
          description="Audit trail for warehouse zone changes."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
