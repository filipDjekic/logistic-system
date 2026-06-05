import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Button, Chip, Grid, Stack, TablePagination, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import WarehouseStorageFlowGuide from '../components/WarehouseStorageFlowGuide';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import { buildSortParam, type PageResponse } from '../../../core/api/pagination';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import type { StockMovementResponse } from '../../stock-movements/types/stockMovement.types';
import { useBinInventory, useBinLocation, useInternalWarehouseMovements } from '../hooks/useWarehouseLocations';
import type { BinInventoryResponse, InternalWarehouseMovementResponse } from '../types/warehouseLocation.types';

type TabKey = 'overview' | 'bin-inventory' | 'stock-movements' | 'internal-movements' | 'change-history';

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

export default function BinDetailsPage() {
  const { warehouseId: warehouseParam, zoneId: zoneParam, binId: binParam } = useParams();
  const warehouseId = toNumber(warehouseParam);
  const zoneId = toNumber(zoneParam);
  const binId = toNumber(binParam);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [inventorySearch, setInventorySearch] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockProduct, setStockProduct] = useState<LookupOption | null>(null);
  const inventoryPage = usePagedState();
  const movementPage = usePagedState();
  const stockPage = usePagedState();

  const binQuery = useBinLocation(binId, Boolean(warehouseId && zoneId && binId));
  const currentBin = binQuery.data ?? null;

  const inventoryQuery = useBinInventory({
    warehouseId,
    zoneId,
    binLocationId: binId,
    search: inventorySearch.trim() || undefined,
    page: inventoryPage.page,
    size: inventoryPage.size,
    sort: buildSortParam({ field: 'productName', direction: 'asc' }),
  }, Boolean(warehouseId && zoneId && binId));

  const stockMovementsQuery = useQuery({
    queryKey: ['stock-movements', 'bin-details', warehouseId, binId, stockSearch, stockProduct?.id, stockPage.page, stockPage.size],
    queryFn: () => stockMovementsApi.getAll({
      warehouseId: warehouseId ?? 'ALL',
      productId: stockProduct?.id ?? 'ALL',
      search: stockSearch,
      page: stockPage.page,
      size: stockPage.size,
      sort: 'createdAt,desc',
    }),
    enabled: Boolean(warehouseId && binId),
    staleTime: 20_000,
  });

  const movementsQuery = useInternalWarehouseMovements({
    warehouseId,
    binLocationId: binId,
    search: movementSearch.trim() || undefined,
    page: movementPage.page,
    size: movementPage.size,
    sort: 'createdAt,desc',
  }, Boolean(warehouseId && binId));


  const inventoryColumns: DataTableColumn<BinInventoryResponse>[] = [
    { id: 'product', header: 'Product', render: (row) => `${row.productName} (${row.sku})` },
    { id: 'quantity', header: 'Quantity', align: 'right', render: (row) => <Typography fontWeight={800}>{row.quantity}</Typography> },
    { id: 'zone', header: 'Zone', render: (row) => row.zoneCode },
    { id: 'updated', header: 'Updated', render: (row) => formatDate(row.lastUpdated) },
  ];

  const stockMovementColumns: DataTableColumn<StockMovementResponse>[] = [
    { id: 'id', header: 'Movement', render: (row) => <Button size="small" component={RouterLink} to={`/stock-movements/${row.id}`}>#{row.id}</Button> },
    { id: 'type', header: 'Type', render: (row) => <Chip size="small" label={row.movementType} /> },
    { id: 'product', header: 'Product', render: (row) => <Button size="small" component={RouterLink} to={`/products/${row.productId}`}>{row.productName}</Button> },
    { id: 'quantity', header: 'Quantity', align: 'right', render: (row) => row.quantity },
    { id: 'beforeAfter', header: 'Before → after', render: (row) => `${row.quantityBefore} → ${row.quantityAfter}` },
    { id: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
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
    { value: 'bin-inventory', label: 'Bin inventory' },
    { value: 'stock-movements', label: 'Stock movements' },
    { value: 'internal-movements', label: 'Internal movements' },
    { value: 'change-history', label: 'Change history' },
  ];

  if (!warehouseId || !zoneId || !binId) {
    return <Alert severity="error">Invalid bin route.</Alert>;
  }

  return (
    <EntityDetailsLayout
      overline="Warehouse bin"
      title={currentBin ? `${currentBin.code} · ${currentBin.name}` : `Bin #${binId}`}
      description="Bin details are split into overview, bin inventory, stock movements, internal movements and change history."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as TabKey)}
      actions={<Button component={RouterLink} to={`/warehouses/${warehouseId}/zones/${zoneId}`} variant="outlined">Back to zone</Button>}
    >
      <WarehouseStorageFlowGuide warehouseId={warehouseId} zoneId={zoneId} binId={binId} compact />

      {activeTab === 'overview' ? (
        <SectionCard title="Overview" description="Core bin attributes.">
          <Grid container spacing={2}>
            {[
              ['Warehouse', currentBin?.warehouseName ?? `#${warehouseId}`],
              ['Zone', currentBin ? `${currentBin.zoneCode} · ${currentBin.zoneName}` : `#${zoneId}`],
              ['Code', currentBin?.code ?? `#${binId}`],
              ['Label', currentBin?.name ?? '—'],
              ['Zone type', currentBin?.zoneType ?? '—'],
              ['Capacity', currentBin?.capacity ?? '—'],
              ['Status', currentBin?.active ? 'ACTIVE' : 'INACTIVE'],
              ['Description', currentBin?.description ?? '—'],
              ['Created', formatDate(currentBin?.createdAt)],
              ['Updated', formatDate(currentBin?.updatedAt)],
            ].map(([label, value]) => (
              <Grid key={label} size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
                <Typography fontWeight={700}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </SectionCard>
      ) : null}

      {activeTab === 'bin-inventory' ? (
        <SectionCard title="Bin inventory" description="Physical stock placement inside this bin.">
          <Stack spacing={2}>
            <TextField label="Search product/name/SKU" value={inventorySearch} onChange={(event) => { setInventorySearch(event.target.value); inventoryPage.reset(); }} size="small" fullWidth />
            <DataTable columns={inventoryColumns} rows={inventoryQuery.data?.content ?? []} getRowId={(row) => `${row.binLocationId}-${row.productId}`} loading={inventoryQuery.isLoading} error={inventoryQuery.isError} onRetry={() => inventoryQuery.refetch()} pagination={inventoryPage.pagination(inventoryQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'stock-movements' ? (
        <SectionCard title="Stock movements" description="Warehouse stock movements connected to products placed in this bin. Product filter narrows the trace.">
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><TextField label="Search stock movements" value={stockSearch} onChange={(event) => { setStockSearch(event.target.value); stockPage.reset(); }} size="small" fullWidth /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><EntityLookupField label="Product filter" entityType="products" value={stockProduct} onChange={(option) => { setStockProduct(option); stockPage.reset(); }} /></Grid>
            </Grid>
            <DataTable columns={stockMovementColumns} rows={stockMovementsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={stockMovementsQuery.isLoading} error={stockMovementsQuery.isError} onRetry={() => stockMovementsQuery.refetch()} pagination={stockPage.pagination(stockMovementsQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'internal-movements' ? (
        <SectionCard title="Internal movements" description="Bin-to-bin movement trace for this bin.">
          <Stack spacing={2}>
            <TextField label="Search product/SKU/bin/note" value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); movementPage.reset(); }} size="small" fullWidth />
            <DataTable columns={movementColumns} rows={movementsQuery.data?.content ?? []} getRowId={(row) => row.id} loading={movementsQuery.isLoading} error={movementsQuery.isError} onRetry={() => movementsQuery.refetch()} pagination={movementPage.pagination(movementsQuery.data)} />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'change-history' ? (
        <ChangeHistoryPanel
          entityName="BIN_LOCATION"
          entityId={binId}
          title="Bin change history"
          description="Audit trail for bin location changes."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
