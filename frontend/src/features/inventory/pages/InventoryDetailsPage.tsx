import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value === null || value === undefined || value === '' ? '—' : String(value)}
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
      <Typography variant="body2" fontWeight={800} align="right">{numeric}</Typography>
      <LinearProgress variant="determinate" value={percent} />
    </Stack>
  );
}

export default function InventoryDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuthStore();
  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.WAREHOUSE_MANAGER;
  const [activeTab, setActiveTab] = useState('overview');
  const binDistributionPage = usePagedState(20);
  const stockMovementPage = usePagedState();
  const initialStockPage = usePagedState();
  const reservationPage = usePagedState();
  const internalMovementPage = usePagedState();

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

  const initialStockQuery = useStockMovements(
    {
      search: '',
      movementType: 'INBOUND',
      reasonCode: 'INITIAL_STOCK',
      warehouseId: isValidRoute ? warehouseId : 'ALL',
      productId: isValidRoute ? productId : 'ALL',
      transportOrderId: 'ALL',
      fromDate: '',
      toDate: '',
      page: initialStockPage.page,
      size: initialStockPage.size,
      sort: 'createdAt,desc',
    },
    isValidRoute && activeTab === 'initialStock',
  );

  const reservationMovementsQuery = useStockMovements(
    {
      search: '',
      movementType: 'RESERVATION',
      warehouseId: isValidRoute ? warehouseId : 'ALL',
      productId: isValidRoute ? productId : 'ALL',
      transportOrderId: 'ALL',
      fromDate: '',
      toDate: '',
      page: reservationPage.page,
      size: reservationPage.size,
      sort: 'createdAt,desc',
    },
    isValidRoute && activeTab === 'reservations',
  );

  const internalMovementsQuery = useInternalWarehouseMovements({
    warehouseId: isValidRoute ? warehouseId : -1,
    productId: isValidRoute ? productId : -1,
    page: internalMovementPage.page,
    size: internalMovementPage.size,
    sort: 'createdAt,desc',
  }, isValidRoute && activeTab === 'internalMovements');

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
  const internalMovementRows = internalMovementsQuery.data?.content ?? [];
  const stockMovementRows = stockMovementsQuery.data?.content ?? [];
  const initialStockRows = initialStockQuery.data?.content ?? [];
  const reservationRows = reservationMovementsQuery.data?.content ?? [];
  const totalBinQuantity = binRows.reduce((sum, row) => sum + toNumber(row.quantity), 0);
  const inventoryRecommendedStep = (() => {
    if (record.quantity <= record.minStockLevel) {
      return {
        title: 'Replenish or investigate low stock.',
        description: 'Current quantity is at or below the minimum stock level. Review stock movements and create an inbound/adjustment operation if the stock level is not intentional.',
        severity: 'warning' as const,
        actions: [
          ...(canManage ? [{ label: 'Create stock movement', to: '/stock-movements/create' }] : []),
          { label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const },
        ],
      };
    }

    if (record.reservedQuantity > 0) {
      return {
        title: 'Review active reservations.',
        description: 'Part of this inventory is reserved. Check reservation movements before promising available quantity to another transport or warehouse process.',
        severity: 'info' as const,
        actions: [{ label: 'Open reservations', onClick: () => setActiveTab('reservations'), variant: 'outlined' as const }],
      };
    }

    if (warehouse?.binTrackingEnabled && totalBinQuantity !== toNumber(record.quantity)) {
      return {
        title: 'Check bin distribution mismatch.',
        description: 'Warehouse quantity and bin-distributed quantity are not fully aligned. Review bin distribution before internal movement or picking.',
        severity: 'warning' as const,
        actions: [{ label: 'Open bin distribution', onClick: () => setActiveTab('binDistribution') }],
      };
    }

    return {
      title: 'Review movement history before making changes.',
      description: 'Inventory is in a normal state. Use stock movements and internal movements to understand how the current quantity was reached.',
      severity: 'info' as const,
      actions: [{ label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const }],
    };
  })();

  return (
    <EntityDetailsLayout
      overline="Storage"
      title={`${record.warehouseName} · ${record.productName}`}
      description="Detailed warehouse/product inventory record with physical bin distribution and movement history."
      tabs={[
        { value: 'overview', label: 'Overview' },
        { value: 'binDistribution', label: `Bin distribution ${binInventoryQuery.data ? `(${binInventoryQuery.data.totalElements})` : ''}` },
        { value: 'stockMovements', label: `Stock movements ${stockMovementsQuery.data ? `(${stockMovementsQuery.data.totalElements})` : ''}` },
        { value: 'initialStock', label: `Initial stock ${initialStockQuery.data ? `(${initialStockQuery.data.totalElements})` : ''}` },
        { value: 'internalMovements', label: `Internal movements ${internalMovementsQuery.data ? `(${internalMovementsQuery.data.totalElements})` : ''}` },
        ...(record.reservedQuantity > 0 || reservationMovementsQuery.data ? [{ value: 'reservations', label: `Reservations ${reservationMovementsQuery.data ? `(${reservationMovementsQuery.data.totalElements})` : ''}` }] : []),
        { value: 'changeHistory', label: 'Change history' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
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

          {!warehouse || !product ? (
            <Alert severity="info">
              Core inventory record is loaded, but related warehouse or product lookup is not currently available.
            </Alert>
          ) : null}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Warehouse">
                <Stack spacing={2}>
                  <InfoRow label="Name" value={warehouse?.name ?? record.warehouseName} />
                  <InfoRow label="Address" value={warehouse?.address ?? null} />
                  <InfoRow label="City" value={warehouse?.city ?? record.warehouseCity} />
                  <InfoRow label="Capacity" value={warehouse?.capacity ?? null} />
                  <InfoRow label="Status" value={warehouse?.status ?? record.warehouseStatus} />
                  {warehouse?.employeeId ? (
                    <Button
                      component={RouterLink}
                      to={`/employees/${warehouse.employeeId}`}
                      variant="text"
                      sx={{ alignSelf: 'flex-start', p: 0 }}
                    >
                      Open manager profile
                    </Button>
                  ) : null}
                </Stack>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="Product">
                <Stack spacing={2}>
                  <InfoRow label="Name" value={product?.name ?? record.productName} />
                  <InfoRow label="SKU" value={product?.sku ?? record.productSku} />
                  <InfoRow label="Unit" value={product?.unit ?? record.productUnit} />
                  <InfoRow label="Price" value={product?.price ?? null} />
                  <InfoRow
                    label="Fragile"
                    value={product == null ? null : product.fragile ? 'Yes' : 'No'}
                  />
                  <InfoRow label="Weight" value={product?.weight ?? null} />
                </Stack>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <SectionCard title="Inventory status">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <InfoRow label="Quantity" value={record.quantity} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <InfoRow label="Reserved quantity" value={record.reservedQuantity} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <InfoRow label="Available quantity" value={record.availableQuantity} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <InfoRow label="Minimum stock level" value={record.minStockLevel} />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <InventoryStatusChip status={record.derivedStatus} />
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      Inventory details are derived from the warehouse inventory backend response and remain scoped by company access.
                    </Typography>
                  </Grid>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {binRows.map((row) => (
                  <TableRow key={`${row.binLocationId}-${row.productId}`} hover>
                    <TableCell>{row.zoneCode}</TableCell>
                    <TableCell>{row.binLocationCode} · {row.binLocationName}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 180 }}><QuantityShare value={row.quantity} total={totalBinQuantity} /></TableCell>
                    <TableCell>{formatDate(row.lastUpdated)}</TableCell>
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
        <RelatedDataSection
          title="Stock movements"
          description="Inbound, outbound, adjustment and transfer movements for this warehouse/product pair."
          loading={stockMovementsQuery.isLoading}
          error={stockMovementsQuery.isError}
          onRetry={() => { void stockMovementsQuery.refetch(); }}
          empty={!stockMovementsQuery.isLoading && !stockMovementsQuery.isError && stockMovementRows.length === 0}
          emptyTitle="No stock movements"
          emptyDescription="No stock movements have been recorded for this inventory record yet."
        >
          <Stack spacing={1.25}>
            {stockMovementRows.map((movement) => (
              <Stack key={movement.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" fontWeight={700}>{movement.movementType} · Qty {movement.quantity}</Typography>
                  <Button size="small" component={RouterLink} to={`/stock-movements/${movement.id}`}>Open movement</Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {movement.quantityBefore} → {movement.quantityAfter}{movement.reasonCode ? ` · ${movement.reasonCode}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(movement.createdAt)}</Typography>
              </Stack>
            ))}
            {stockMovementPage.pagination(stockMovementsQuery.data)}
          </Stack>
        </RelatedDataSection>
      ) : null}


      {activeTab === 'initialStock' ? (
        <RelatedDataSection
          title="Initial stock"
          description="Opening stock setup movements for this warehouse/product inventory record. This is intentionally separated from bin distribution."
          loading={initialStockQuery.isLoading}
          error={initialStockQuery.isError}
          onRetry={() => { void initialStockQuery.refetch(); }}
          empty={!initialStockQuery.isLoading && !initialStockQuery.isError && initialStockRows.length === 0}
          emptyTitle="No initial stock movements"
          emptyDescription="No opening stock movement is linked with this inventory record."
        >
          <Stack spacing={1.25}>
            {initialStockRows.map((movement) => (
              <Stack key={movement.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" fontWeight={700}>{movement.reasonCode ?? movement.movementType} · Qty {movement.quantity}</Typography>
                  <Button size="small" component={RouterLink} to={`/stock-movements/${movement.id}`}>Open movement</Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {movement.quantityBefore} → {movement.quantityAfter}{movement.referenceNumber ? ` · ${movement.referenceNumber}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(movement.createdAt)}</Typography>
              </Stack>
            ))}
            {initialStockPage.pagination(initialStockQuery.data)}
          </Stack>
        </RelatedDataSection>
      ) : null}

      {activeTab === 'reservations' ? (
        <RelatedDataSection
          title="Reservations"
          description="Reservation movements for this warehouse/product inventory record. Current reserved and available quantities stay visible here."
          loading={reservationMovementsQuery.isLoading}
          error={reservationMovementsQuery.isError}
          onRetry={() => { void reservationMovementsQuery.refetch(); }}
          empty={!reservationMovementsQuery.isLoading && !reservationMovementsQuery.isError && reservationRows.length === 0}
          emptyTitle="No reservations"
          emptyDescription="There are no reservation movements for this inventory record."
        >
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Reserved quantity</Typography>
                  <Typography variant="h6" fontWeight={900}>{record.reservedQuantity}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Available quantity</Typography>
                  <Typography variant="h6" fontWeight={900}>{record.availableQuantity}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Reservation status</Typography>
                  <Typography variant="h6" fontWeight={900}>{record.reservedQuantity > 0 ? 'RESERVED' : 'NO ACTIVE RESERVATION'}</Typography>
                </Box>
              </Grid>
            </Grid>
            {reservationRows.map((movement) => (
              <Stack key={movement.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={700}>{movement.movementType} · Qty {movement.quantity}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Reserved {movement.reservedBefore ?? '—'} → {movement.reservedAfter ?? '—'} · Available {movement.availableBefore ?? '—'} → {movement.availableAfter ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(movement.createdAt)}</Typography>
              </Stack>
            ))}
            {reservationPage.pagination(reservationMovementsQuery.data)}
          </Stack>
        </RelatedDataSection>
      ) : null}

      {activeTab === 'internalMovements' ? (
        <RelatedDataSection
          title="Internal warehouse movements"
          description="Bin-to-bin movements for this product in the selected warehouse."
          loading={internalMovementsQuery.isLoading}
          error={internalMovementsQuery.isError}
          onRetry={() => { void internalMovementsQuery.refetch(); }}
          empty={!internalMovementsQuery.isLoading && !internalMovementsQuery.isError && internalMovementRows.length === 0}
          emptyTitle="No internal movements"
          emptyDescription="No internal warehouse movements are linked with this inventory record."
        >
          <Stack spacing={1.25}>
            {internalMovementRows.map((movement) => (
              <Stack key={movement.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}/zones/${movement.sourceBinZoneId}/bins/${movement.sourceBinId}`}>{movement.sourceBinCode}</Button>
                  <Typography variant="body2" color="text.secondary">→</Typography>
                  <Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}/zones/${movement.destinationBinZoneId}/bins/${movement.destinationBinId}`}>{movement.destinationBinCode}</Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">Qty {movement.quantity} · {movement.status}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(movement.createdAt)}</Typography>
              </Stack>
            ))}
            {internalMovementPage.pagination(internalMovementsQuery.data)}
          </Stack>
        </RelatedDataSection>
      ) : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel
          entityName="WAREHOUSE_INVENTORY"
          entityId={record.warehouseId}
          search={`warehouseId=${record.warehouseId}, productId=${record.productId}`}
          title="Inventory change history"
          description="Business audit trail for this exact warehouse/product inventory row."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
