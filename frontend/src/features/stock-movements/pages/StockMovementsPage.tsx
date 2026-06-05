import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import { EntityLookupField, type LookupOption } from '../../lookup';
import StockMovementsTable from '../components/StockMovementsTable';
import { useStockMovements } from '../hooks/useStockMovements';
import { useInternalWarehouseMovements } from '../../warehouse-locations/hooks/useWarehouseLocations';
import type { SortState } from '../../../shared/types/common.types';
import type { StockMovementFiltersState } from '../types/stockMovement.types';
import type { InternalWarehouseMovementResponse } from '../../warehouse-locations/types/warehouseLocation.types';
import { stockMovementTypeOptions } from '../validation/stockMovementSchema';

function InternalMovementsList({ rows }: { rows: InternalWarehouseMovementResponse[] }) {
  return (
    <Stack spacing={1.25}>
      {rows.map((movement) => (
        <Stack key={movement.id} spacing={0.75} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" fontWeight={800}>
              {movement.sourceBinCode} → {movement.destinationBinCode}
            </Typography>
            <Chip size="small" label={movement.status} variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {movement.productName} {movement.sku ? `(${movement.sku})` : ''} · Qty {movement.quantity}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}`}>Warehouse</Button>
            <Button size="small" component={RouterLink} to={`/products/${movement.productId}`}>Product</Button>
            <Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}/zones/${movement.sourceBinZoneId}/bins/${movement.sourceBinId}`}>Source bin</Button>
            <Button size="small" component={RouterLink} to={`/warehouses/${movement.warehouseId}/zones/${movement.destinationBinZoneId}/bins/${movement.destinationBinId}`}>Destination bin</Button>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

export default function StockMovementsPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'internal' ? 'internal' : 'stock';

  const canCreate =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const [filters, setFilters] = useState<StockMovementFiltersState>({
    search: '',
    movementType: 'ALL',
    warehouseId: 'ALL',
    productId: 'ALL',
    transportOrderId: 'ALL',
    fromDate: '',
    toDate: '',
  });

  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LookupOption | null>(null);
  const [selectedTransportOrder, setSelectedTransportOrder] = useState<LookupOption | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };


  useEffect(() => {
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const transportId = searchParams.get('transportId') ?? searchParams.get('transportOrderId');

    setFilters((current) => {
      const nextWarehouseId = warehouseId && Number.isFinite(Number(warehouseId)) ? Number(warehouseId) : current.warehouseId;
      const nextProductId = productId && Number.isFinite(Number(productId)) ? Number(productId) : current.productId;
      const nextTransportOrderId = transportId && Number.isFinite(Number(transportId)) ? Number(transportId) : current.transportOrderId;

      if (nextWarehouseId === current.warehouseId && nextProductId === current.productId && nextTransportOrderId === current.transportOrderId) {
        return current;
      }

      setPage(0);
      return {
        ...current,
        warehouseId: nextWarehouseId,
        productId: nextProductId,
        transportOrderId: nextTransportOrderId,
      };
    });
  }, [searchParams]);

  const stockMovementQueryFilters = useMemo(
    () => ({ ...filters, page, size, sort: buildSortParam(sort) }),
    [filters, page, size, sort],
  );

  const internalMovementQueryFilters = useMemo(
    () => ({
      page,
      size,
      sort: buildSortParam(sort),
      warehouseId: filters.warehouseId === 'ALL' ? undefined : filters.warehouseId,
      productId: filters.productId === 'ALL' ? undefined : filters.productId,
      search: filters.search.trim() || undefined,
    }),
    [filters.productId, filters.search, filters.warehouseId, page, size, sort],
  );

  const stockMovementsQuery = useStockMovements(stockMovementQueryFilters, activeTab === 'stock');
  const internalMovementsQuery = useInternalWarehouseMovements(internalMovementQueryFilters, activeTab === 'internal');

  const updateFilters = (next: Partial<StockMovementFiltersState>) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const clearFilters = () => {
    setSelectedWarehouse(null);
    setSelectedProduct(null);
    setSelectedTransportOrder(null);
    setSearchParams({}, { replace: true });
    setPage(0);
    setFilters({
      search: '',
      movementType: 'ALL',
      warehouseId: 'ALL',
      productId: 'ALL',
      transportOrderId: 'ALL',
      fromDate: '',
      toDate: '',
    });
  };

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.movementType !== 'ALL' ||
    filters.warehouseId !== 'ALL' ||
    filters.productId !== 'ALL' ||
    filters.transportOrderId !== 'ALL' ||
    filters.fromDate.length > 0 ||
    filters.toDate.length > 0;

  return (
    <>
      <PageHeader
        overline="Inventory"
        title="Stock Movements"
        description="Movement history is read-only here. Stock operations are created through one controlled create page."
        actions={
          canCreate ? (
            <Button variant="contained" onClick={() => navigate('/stock-movements/create')}>
              Create stock movement
            </Button>
          ) : null
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_, value) => {
          setPage(0);
          setSearchParams(value === 'internal' ? { tab: 'internal' } : {});
        }}
        sx={{ mb: 2 }}
      >
        <Tab value="stock" label="Stock movements" />
        <Tab value="internal" label="Internal movements" />
      </Tabs>

      <TableLayout
        title={activeTab === 'stock' ? 'Movement history' : 'Internal bin movements'}
        description={activeTab === 'stock' ? 'Use server-side filters. Warehouse, product and transport filters use search panels instead of loading large dropdown lists.' : 'Internal movements are bin-to-bin operations scoped inside a warehouse.'}
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(search) => updateFilters({ search })}
            searchPlaceholder="Search by movement, warehouse, product, quantity or ID"
            onRefresh={() => { void (activeTab === 'stock' ? stockMovementsQuery.refetch() : internalMovementsQuery.refetch()); }}
            refreshDisabled={activeTab === 'stock' ? stockMovementsQuery.isFetching : internalMovementsQuery.isFetching}
            onClearFilters={clearFilters}
            clearDisabled={(activeTab === 'stock' ? stockMovementsQuery.isFetching : internalMovementsQuery.isFetching) || !hasActiveFilters}
          />
        }
        filters={
          <>
            <FilterPanel minColumnWidth={240}>
              <TextField
                select
                size="small"
                label="Movement type"
                value={filters.movementType}
                onChange={(event) => updateFilters({ movementType: event.target.value as StockMovementFiltersState['movementType'] })}
              >
                <MenuItem value="ALL">All</MenuItem>
                {stockMovementTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="From date"
                type="datetime-local"
                value={filters.fromDate}
                onChange={(event) => updateFilters({ fromDate: event.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                size="small"
                label="To date"
                type="datetime-local"
                value={filters.toDate}
                onChange={(event) => updateFilters({ toDate: event.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </FilterPanel>

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
              <EntityLookupField
                label="Warehouse"
                entityType="warehouses"
                value={selectedWarehouse}
                onChange={(warehouse) => {
                  setSelectedWarehouse(warehouse);
                  updateFilters({ warehouseId: warehouse?.id ?? 'ALL' });
                }}
              />
              <EntityLookupField
                label="Product"
                entityType="products"
                value={selectedProduct}
                onChange={(product) => {
                  setSelectedProduct(product);
                  updateFilters({ productId: product?.id ?? 'ALL' });
                }}
              />
              <EntityLookupField
                label="Transport order"
                entityType="transport-orders"
                value={selectedTransportOrder}
                onChange={(transportOrder) => {
                  setSelectedTransportOrder(transportOrder);
                  updateFilters({ transportOrderId: transportOrder?.id ?? 'ALL' });
                }}
              />
            </Stack>
          </>
        }
        table={
          activeTab === 'stock' ? (
            <StockMovementsTable
              rows={stockMovementsQuery.data?.content ?? []}
              loading={stockMovementsQuery.isLoading}
              error={stockMovementsQuery.isError}
              onRetry={() => void stockMovementsQuery.refetch()}
              pagination={
                <ServerTablePagination
                  page={stockMovementsQuery.data}
                  disabled={stockMovementsQuery.isFetching}
                  onPageChange={setPage}
                  onSizeChange={handleSizeChange}
                />
              }
              sort={sort}
              onSortChange={handleSortChange}
            />
          ) : (
            <Stack spacing={2}>
              {internalMovementsQuery.isError ? (
                <Typography color="error">Internal movements could not be loaded.</Typography>
              ) : null}
              {internalMovementsQuery.isLoading ? (
                <Typography color="text.secondary">Loading internal movements...</Typography>
              ) : (
                <InternalMovementsList rows={internalMovementsQuery.data?.content ?? []} />
              )}
              <ServerTablePagination
                page={internalMovementsQuery.data}
                disabled={internalMovementsQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            </Stack>
          )
        }
      />
    </>
  );
}
