import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TablePagination,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { normalizeApiError } from '../../../core/api/apiError';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import InventoryStatusChip from '../components/InventoryStatusChip';
import { useInventoryRecord } from '../hooks/useInventoryRecord';
import { useBinInventory, useInternalWarehouseMovements } from '../../warehouse-locations/hooks/useWarehouseLocations';
import { useStockMovements } from '../../stock-movements/hooks/useStockMovements';

type InventoryDetailsTab = 'overview' | 'binDistribution' | 'stockMovements' | 'activity';

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined | ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} component="div">
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Stack>
  );
}

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

function usePagedState(defaultSize = 10) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);
  const pagination = (data: { totalElements: number; number: number; size: number } | undefined) => (
    <TablePagination
      component="div"
      count={data?.totalElements ?? 0}
      page={data?.number ?? page}
      rowsPerPage={data?.size ?? size}
      rowsPerPageOptions={[5, 10, 20, 50]}
      onPageChange={(_, nextPage) => setPage(nextPage)}
      onRowsPerPageChange={(event) => {
        setPage(0);
        setSize(Number(event.target.value));
      }}
    />
  );

  return { page, size, pagination };
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

          <SectionCard title="Inventory overview">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Quantity" value={record.quantity} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Reserved" value={record.reservedQuantity} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Available" value={record.availableQuantity} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <InventoryStatusChip status={record.derivedStatus} />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Minimum stock" value={record.minStockLevel} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Average unit cost" value={formatMoney(record.averageUnitCost, record.currency)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Total value" value={formatMoney(record.totalValue, record.currency)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Currency" value={record.currency ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Warehouse" value={<Button size="small" component={RouterLink} to={`/warehouses/${record.warehouseId}`}>{record.warehouseName}</Button>} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Product" value={<Button size="small" component={RouterLink} to={`/products/${record.productId}`}>{record.productName}</Button>} /></Grid>
            </Grid>
          </SectionCard>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Warehouse">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Name" value={warehouse?.name ?? record.warehouseName} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="City" value={warehouse?.city ?? record.warehouseCity} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Status" value={warehouse?.status ?? record.warehouseStatus} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Bin tracking" value={warehouse?.binTrackingEnabled ? 'Enabled' : 'Disabled'} /></Grid>
                  <Grid size={{ xs: 12 }}><InfoRow label="Address" value={warehouse?.address ?? null} /></Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Product">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Name" value={product?.name ?? record.productName} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="SKU" value={product?.sku ?? record.productSku} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Unit" value={product?.unit ?? record.productUnit} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Weight" value={product?.weight ?? null} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><InfoRow label="Fragile" value={product == null ? null : product.fragile ? 'Yes' : 'No'} /></Grid>
                </Grid>
              </SectionCard>
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
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Zone</TableCell>
                    <TableCell>Bin</TableCell>
                    <TableCell align="right">Quantity share</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {binRows.map((row) => (
                    <TableRow key={`${row.binLocationId}-${row.productId}`} hover>
                      <TableCell>{row.zoneCode}</TableCell>
                      <TableCell>{row.binLocationCode} · {row.binLocationName}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 180 }}><QuantityShare value={row.quantity} total={totalBinQuantity} /></TableCell>
                      <TableCell>{formatDate(row.lastUpdated)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" component={RouterLink} to={binDetailsPath(row.warehouseId, row.zoneId, row.binLocationId)}>
                          Open bin
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {binDistributionPage.pagination(binInventoryQuery.data)}
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
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockMovementRows.map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell>{formatDate(movement.createdAt)}</TableCell>
                        <TableCell>{movement.movementType}</TableCell>
                        <TableCell>{movement.reasonCode ?? '—'}</TableCell>
                        <TableCell align="right">{movement.quantity}</TableCell>
                        <TableCell>{movement.quantityBefore} → {movement.quantityAfter}</TableCell>
                        <TableCell align="right">{formatMoney(movement.totalCost, movement.currency)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" component={RouterLink} to={`/stock-movements/${movement.id}`}>Open</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {stockMovementPage.pagination(stockMovementsQuery.data)}
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
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Source bin</TableCell>
                      <TableCell>Destination bin</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {internalMovementRows.map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell>{formatDate(movement.createdAt)}</TableCell>
                        <TableCell>
                          <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.sourceBinZoneId, movement.sourceBinId)}>
                            {movement.sourceBinCode}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button size="small" component={RouterLink} to={binDetailsPath(movement.warehouseId, movement.destinationBinZoneId, movement.destinationBinId)}>
                            {movement.destinationBinCode}
                          </Button>
                        </TableCell>
                        <TableCell align="right">{movement.quantity}</TableCell>
                        <TableCell>{movement.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {internalMovementPage.pagination(internalMovementsQuery.data)}
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
