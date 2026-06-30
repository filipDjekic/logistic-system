import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { normalizeApiError } from '../../../core/api/apiError';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import DataTable from '../../../shared/components/DataTable/DataTable';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import useDetailsPagination from '../../../shared/hooks/useDetailsPagination';
import {
  DetailsMetadataCard,
  DetailsOverviewCard,
  DetailsStatisticsCard,
  EntityDetailsLayout,
  RelatedDataSection,
} from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import InventoryStatusChip from '../components/InventoryStatusChip';
import { useInventoryRecord } from '../hooks/useInventoryRecord';
import { useBinInventory, useInternalWarehouseMovements } from '../../warehouse-locations/hooks/useWarehouseLocations';
import { useStockMovements } from '../../stock-movements/hooks/useStockMovements';

type InventoryDetailsTab = 'overview' | 'binDistribution' | 'stockMovements' | 'activity';

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}


function formatMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return currency ? `${value} ${currency}` : String(value);
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function usePagedState<T = unknown>(defaultSize = 10) {
  return useDetailsPagination<T>(defaultSize);
}

function QuantityShare({ value, total }: { value: number | string | null | undefined; total: number }) {
  const numeric = toNumber(value);
  const percent = total > 0 ? Math.min(100, Math.max(0, (numeric / total) * 100)) : 0;

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" fontWeight={800} align="right">
        {numeric}
      </Typography>
      <LinearProgress variant="determinate" value={percent} />
    </Stack>
  );
}

function binDetailsPath(warehouseId: number, zoneId: number | null | undefined, binId: number | null | undefined) {
  if (!zoneId || !binId) {
    return `/warehouses/${warehouseId}/zones`;
  }

  return `/warehouses/${warehouseId}/zones/${zoneId}/bins/${binId}`;
}

export default function InventoryDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuthStore();
  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.WAREHOUSE_MANAGER;
  const [activeTab, setActiveTab] = useState<InventoryDetailsTab>('overview');
  const binDistributionPage = usePagedState(20);
  const stockMovementPage = usePagedState(20);
  const internalMovementPage = usePagedState(10);

  const warehouseId = useMemo(() => Number(params.warehouseId), [params.warehouseId]);
  const productId = useMemo(() => Number(params.productId), [params.productId]);

  const isValidRoute =
    Number.isInteger(warehouseId) &&
    warehouseId > 0 &&
    Number.isInteger(productId) &&
    productId > 0;

  const inventoryRecordQuery = useInventoryRecord(
    isValidRoute ? warehouseId : null,
    isValidRoute ? productId : null,
  );

  const binInventoryQuery = useBinInventory({
    warehouseId: isValidRoute ? warehouseId : -1,
    productId: isValidRoute ? productId : -1,
    page: binDistributionPage.page,
    size: binDistributionPage.size,
    sort: 'binLocation.code,asc',
  }, isValidRoute && activeTab === 'binDistribution');

  const stockMovementsQuery = useStockMovements(
    {
      search: '',
      movementType: 'ALL',
      warehouseId: isValidRoute ? warehouseId : 'ALL',
      productId: isValidRoute ? productId : 'ALL',
      transportOrderId: 'ALL',
      fromDate: '',
      toDate: '',
      page: stockMovementPage.page,
      size: stockMovementPage.size,
      sort: 'createdAt,desc',
    },
    isValidRoute && activeTab === 'stockMovements',
  );

  const internalMovementsQuery = useInternalWarehouseMovements({
    warehouseId: isValidRoute ? warehouseId : -1,
    productId: isValidRoute ? productId : -1,
    page: internalMovementPage.page,
    size: internalMovementPage.size,
    sort: 'createdAt,desc',
  }, isValidRoute && activeTab === 'stockMovements');

  if (!isValidRoute) {
    return (
      <ErrorState
        title="Invalid inventory route"
        description="Warehouse ID and product ID must both be positive integers."
      />
    );
  }

  if (inventoryRecordQuery.isLoading) {
    return <InlineLoader message="Loading inventory record..." />;
  }

  if (inventoryRecordQuery.isError || !inventoryRecordQuery.data) {
    const error = normalizeApiError(
      inventoryRecordQuery.error,
      'The requested inventory record was not found or could not be loaded.',
    );

    return (
      <ErrorState
        title={
          error.status === 403
            ? 'Access denied'
            : error.status === 404
              ? 'Inventory record not found'
              : 'Inventory record could not be loaded'
        }
        description={error.message}
        details={error.fieldErrors}
        onRetry={() => {
          void inventoryRecordQuery.refetch();
        }}
      />
    );
  }

  const { record, warehouse, product } = inventoryRecordQuery.data;
  const binRows = binInventoryQuery.data?.content ?? [];
  const stockMovementRows = stockMovementsQuery.data?.content ?? [];
  const internalMovementRows = internalMovementsQuery.data?.content ?? [];
  const totalBinQuantity = binRows.reduce((sum, row) => sum + toNumber(row.quantity), 0);

  const inventoryRecommendedStep = (() => {
    if (record.quantity <= record.minStockLevel) {
      return {
        title: 'Replenish or investigate low stock.',
        description: 'Current quantity is at or below the minimum stock level. Review stock movements and create an inbound or adjustment operation if this level is not intentional.',
        severity: 'warning' as const,
        actions: [
          ...(canManage ? [{ label: 'Create stock movement', to: '/stock-movements/create' }] : []),
          { label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const },
        ],
      };
    }

    if (record.reservedQuantity > 0) {
      return {
        title: 'Review reserved quantity before promising stock.',
        description: 'This inventory record has reserved stock. Check stock movements before planning a new outbound operation.',
        severity: 'info' as const,
        actions: [{ label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const }],
      };
    }

    if (warehouse?.binTrackingEnabled && activeTab === 'binDistribution' && totalBinQuantity !== toNumber(record.quantity)) {
      return {
        title: 'Check bin distribution mismatch.',
        description: 'Warehouse quantity and bin-distributed quantity are not fully aligned. Review bin distribution before internal movement or picking.',
        severity: 'warning' as const,
        actions: [{ label: 'Open bin distribution', onClick: () => setActiveTab('binDistribution') }],
      };
    }

    return {
      title: 'Inventory is ready for operational review.',
      description: 'Use bin distribution to see where the product is stored and stock movements to verify how the current quantity was reached.',
      severity: 'info' as const,
      actions: [
        { label: 'Open bin distribution', onClick: () => setActiveTab('binDistribution'), variant: 'outlined' as const },
        { label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const },
      ],
    };
  })();

  return (
    <EntityDetailsLayout
      overline="Storage"
      title={`${record.warehouseName} · ${record.productName}`}
      description="Warehouse/product inventory record, physical bin distribution and stock movement history."
      tabs={[
        { value: 'overview', label: 'Overview' },
        { value: 'binDistribution', label: `Bin distribution${binInventoryQuery.data ? ` (${binInventoryQuery.data.totalElements})` : ''}` },
        { value: 'stockMovements', label: `Stock movements${stockMovementsQuery.data ? ` (${stockMovementsQuery.data.totalElements})` : ''}` },
        { value: 'activity', label: 'Activity' },
      ]}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as InventoryDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {canManage ? (
            <Button
              variant="contained"
              onClick={() => navigate(`/inventory/${record.warehouseId}/${record.productId}/edit`)}
            >
              Edit
            </Button>
          ) : null}
          <Button variant="outlined" onClick={() => navigate('/inventory')}>
            Back to list
          </Button>
        </Stack>
      }
    >
      <RecommendedNextStep {...inventoryRecommendedStep} />

      {activeTab === 'overview' ? (
        <Stack spacing={3}>
          {record.quantity <= record.minStockLevel ? (
            <Alert severity="warning">
              Current quantity is at or below the minimum stock level.
            </Alert>
          ) : null}

          <DetailsStatisticsCard
            title="Inventory quantities"
            description="Current stock position for this warehouse/product pair."
            statistics={[
              { key: 'quantity', title: 'Quantity', value: record.quantity, subtitle: `Minimum ${record.minStockLevel}` },
              { key: 'reserved', title: 'Reserved', value: record.reservedQuantity, subtitle: 'Blocked for operations' },
              { key: 'available', title: 'Available', value: record.availableQuantity, subtitle: 'Usable quantity' },
              { key: 'value', title: 'Total value', value: formatMoney(record.totalValue, record.currency), subtitle: record.currency ?? 'No currency' },
            ]}
          />

          <DetailsOverviewCard
            title="Inventory overview"
            description="Operational identity, status and valuation fields."
            fields={[
              { key: 'status', label: 'Status', value: <InventoryStatusChip status={record.derivedStatus} /> },
              { key: 'minimumStock', label: 'Minimum stock', value: record.minStockLevel },
              { key: 'averageCost', label: 'Average unit cost', value: formatMoney(record.averageUnitCost, record.currency) },
              { key: 'currency', label: 'Currency', value: record.currency ?? '—' },
              { key: 'warehouse', label: 'Warehouse', value: <Button size="small" component={RouterLink} to={`/warehouses/${record.warehouseId}`}>{record.warehouseName}</Button> },
              { key: 'product', label: 'Product', value: <Button size="small" component={RouterLink} to={`/products/${record.productId}`}>{record.productName}</Button> },
            ]}
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsMetadataCard
                title="Warehouse"
                description="Warehouse context for this inventory record."
                columns={{ xs: 12, sm: 6 }}
                fields={[
                  { key: 'name', label: 'Name', value: warehouse?.name ?? record.warehouseName },
                  { key: 'city', label: 'City', value: warehouse?.city ?? record.warehouseCity },
                  { key: 'status', label: 'Status', value: warehouse?.status ?? record.warehouseStatus },
                  { key: 'binTracking', label: 'Bin tracking', value: warehouse?.binTrackingEnabled ? 'Enabled' : 'Disabled' },
                  { key: 'address', label: 'Address', value: warehouse?.address ?? null, size: { xs: 12 } },
                ]}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsMetadataCard
                title="Product"
                description="Product context for this inventory record."
                columns={{ xs: 12, sm: 6 }}
                fields={[
                  { key: 'name', label: 'Name', value: product?.name ?? record.productName },
                  { key: 'sku', label: 'SKU', value: product?.sku ?? record.productSku },
                  { key: 'unit', label: 'Unit', value: product?.unit ?? record.productUnit },
                  { key: 'weight', label: 'Weight', value: product?.weight ?? null },
                  { key: 'fragile', label: 'Fragile', value: product == null ? null : product.fragile ? 'Yes' : 'No' },
                ]}
              />
            </Grid>
          </Grid>
        </Stack>
      ) : null}

      {activeTab === 'binDistribution' ? (
        <RelatedDataSection
          title="Bin distribution"
          description="Physical distribution of this product inside warehouse bins."
          loading={binInventoryQuery.isLoading}
          error={binInventoryQuery.isError}
          onRetry={() => { void binInventoryQuery.refetch(); }}
          empty={!binInventoryQuery.isLoading && !binInventoryQuery.isError && binRows.length === 0}
          emptyTitle="No bin distribution"
          emptyDescription="This inventory record is not assigned to bin locations yet."
        >
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Warehouse quantity</Typography>
                  <Typography variant="h6" fontWeight={900}>{record.quantity}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Quantity assigned to bins</Typography>
                  <Typography variant="h6" fontWeight={900}>{totalBinQuantity}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Distribution status</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={totalBinQuantity === toNumber(record.quantity) ? 'SYNCED' : 'PARTIAL'} color={totalBinQuantity === toNumber(record.quantity) ? 'success' : 'warning'} />
                  </Stack>
                </Box>
              </Grid>
            </Grid>
            <DataTable
              columns={[
                { id: 'zone', header: 'Zone', accessor: 'zoneCode' },
                { id: 'bin', header: 'Bin', render: (row) => `${row.binLocationCode} · ${row.binLocationName}` },
                { id: 'quantity', header: 'Quantity share', align: 'right', minWidth: 180, render: (row) => <QuantityShare value={row.quantity} total={totalBinQuantity} /> },
                { id: 'updated', header: 'Updated', render: (row) => formatDate(row.lastUpdated) },
                { id: 'actions', header: 'Action', align: 'right', render: (row) => <Button size="small" component={RouterLink} to={binDetailsPath(row.warehouseId, row.zoneId, row.binLocationId)}>Open bin</Button> },
              ]}
              rows={binRows}
              getRowId={(row) => `${row.binLocationId}-${row.productId}`}
              size="small"
              minWidth={760}
              emptyTitle="No bin distribution"
              emptyDescription="This inventory record is not distributed across bins yet."
            />
            {binDistributionPage.pagination(binInventoryQuery.data, binInventoryQuery.isFetching)}
          </Stack>
        </RelatedDataSection>
      ) : null}

      {activeTab === 'stockMovements' ? (
        <Stack spacing={3}>
          <RelatedDataSection
            title="Stock movements"
            description="Inbound, outbound, reservation, adjustment, transfer and initial-stock movements for this warehouse/product pair."
            loading={stockMovementsQuery.isLoading}
            error={stockMovementsQuery.isError}
            onRetry={() => { void stockMovementsQuery.refetch(); }}
            empty={!stockMovementsQuery.isLoading && !stockMovementsQuery.isError && stockMovementRows.length === 0}
            emptyTitle="No stock movements"
            emptyDescription="No stock movements have been recorded for this inventory record yet."
          >
            <Stack spacing={2}>
              <DataTable
                columns={[
                  { id: 'date', header: 'Date', render: (movement) => formatDate(movement.createdAt) },
                  { id: 'type', header: 'Type', accessor: 'movementType' },
                  { id: 'reason', header: 'Reason', render: (movement) => movement.reasonCode ?? '—' },
                  { id: 'quantity', header: 'Quantity', align: 'right', accessor: 'quantity' },
                  { id: 'balance', header: 'Balance', render: (movement) => `${movement.quantityBefore} → ${movement.quantityAfter}` },
                  { id: 'value', header: 'Value', align: 'right', render: (movement) => formatMoney(movement.totalCost, movement.currency) },
                  { id: 'actions', header: 'Action', align: 'right', render: (movement) => <Button size="small" component={RouterLink} to={`/stock-movements/${movement.id}`}>Open</Button> },
                ]}
                rows={stockMovementRows}
                getRowId={(movement) => movement.id}
                size="small"
                minWidth={900}
                emptyTitle="No stock movements"
                emptyDescription="No stock movements have been recorded for this inventory record yet."
              />
              {stockMovementPage.pagination(stockMovementsQuery.data, stockMovementsQuery.isFetching)}
            </Stack>
          </RelatedDataSection>

          <RelatedDataSection
            title="Movement trace"
            description="Bin-to-bin movements for this product inside the selected warehouse."
            loading={internalMovementsQuery.isLoading}
            error={internalMovementsQuery.isError}
            onRetry={() => { void internalMovementsQuery.refetch(); }}
            empty={!internalMovementsQuery.isLoading && !internalMovementsQuery.isError && internalMovementRows.length === 0}
            emptyTitle="No bin-to-bin movements"
            emptyDescription="No internal warehouse movements are linked with this inventory record."
          >
            <Stack spacing={2}>
              <DataTable
                columns={[
                  { id: 'date', header: 'Date', render: (movement) => formatDate(movement.createdAt) },
                  { id: 'sourceBin', header: 'Source bin', render: (movement) => <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.sourceBinZoneId, movement.sourceBinId)}>{movement.sourceBinCode}</Button> },
                  { id: 'destinationBin', header: 'Destination bin', render: (movement) => <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.destinationBinZoneId, movement.destinationBinId)}>{movement.destinationBinCode}</Button> },
                  { id: 'quantity', header: 'Quantity', align: 'right', accessor: 'quantity' },
                  { id: 'status', header: 'Status', accessor: 'status' },
                ]}
                rows={internalMovementRows}
                getRowId={(movement) => movement.id}
                size="small"
                minWidth={760}
                emptyTitle="No bin-to-bin movements"
                emptyDescription="No internal warehouse movements are linked with this inventory record."
              />
              {internalMovementPage.pagination(internalMovementsQuery.data, internalMovementsQuery.isFetching)}
            </Stack>
          </RelatedDataSection>
        </Stack>
      ) : null}

      {activeTab === 'activity' ? (
        <ChangeHistoryPanel
          entityName="WAREHOUSE_INVENTORY"
          entityId={record.warehouseId}
          search={`warehouseId=${record.warehouseId}, productId=${record.productId}`}
          title="Inventory activity"
          description="Audit trail for this exact warehouse/product inventory row."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
