import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, MenuItem, Stack, Tab, Tabs, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { SortState } from '../../../shared/types/common.types';
import type { StockMovementFiltersState } from '../types/stockMovement.types';
import { stockMovementStatusOptions, stockMovementTypeOptions } from '../validation/stockMovementSchema';

export default function StockMovementsPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: 'stock' | 'approvals' = tabParam === 'approvals' ? 'approvals' : 'stock';
  const isWorkerView = auth.user?.role === ROLES.WORKER;

  const canCreate = auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const [filters, setFilters] = useState<StockMovementFiltersState>({
    search: '',
    movementType: 'ALL',
    status: 'ALL',
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

      if (
        nextWarehouseId === current.warehouseId &&
        nextProductId === current.productId &&
        nextTransportOrderId === current.transportOrderId
      ) {
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
    () => ({
      ...filters,
      status: activeTab === 'approvals' ? 'PENDING_APPROVAL' : filters.status,
      page,
      size,
      sort: buildSortParam(sort),
    }),
    [activeTab, filters, page, size, sort],
  );

  const stockMovementsQuery = useStockMovements(stockMovementQueryFilters);

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
      status: 'ALL',
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
    (activeTab !== 'approvals' && filters.status !== 'ALL') ||
    filters.warehouseId !== 'ALL' ||
    filters.productId !== 'ALL' ||
    filters.transportOrderId !== 'ALL' ||
    filters.fromDate.length > 0 ||
    filters.toDate.length > 0;

  return (
    <>
      <PageHeader
        overline={isWorkerView ? "My Work" : "Inventory"}
        title={isWorkerView ? "Assigned Stock Movements" : "Stock Movements"}
        description={isWorkerView ? "Stock movements connected to your assigned warehouse work." : "Review stock movement history or create a new stock operation."}
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
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (value === 'approvals') {
              next.set('tab', 'approvals');
            } else {
              next.delete('tab');
            }
            return next;
          });
        }}
        sx={{ mb: 2 }}
      >
        <Tab value="stock" label={isWorkerView ? "Assigned stock movements" : "Stock movements"} />
        <Tab value="approvals" label="Pending approvals" />
      </Tabs>


      {hasActiveFilters ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {filters.warehouseId !== 'ALL' ? <Chip size="small" label={`Warehouse #${filters.warehouseId}`} onDelete={() => updateFilters({ warehouseId: 'ALL' })} /> : null}
          {filters.productId !== 'ALL' ? <Chip size="small" label={`Product #${filters.productId}`} onDelete={() => updateFilters({ productId: 'ALL' })} /> : null}
          {filters.transportOrderId !== 'ALL' ? <Chip size="small" label={`Transport #${filters.transportOrderId}`} onDelete={() => updateFilters({ transportOrderId: 'ALL' })} /> : null}
          {activeTab !== 'approvals' && filters.status !== 'ALL' ? <Chip size="small" label={`Status: ${filters.status}`} onDelete={() => updateFilters({ status: 'ALL' })} /> : null}
          {activeTab === 'approvals' ? <Chip size="small" label="Pending approvals" /> : null}
        </Stack>
      ) : null}

      <TableLayout
        title={activeTab === 'approvals' ? 'Pending stock movement approvals' : 'Movement history'}
        description={activeTab === 'approvals' ? 'Write-offs and large adjustments waiting for approval.' : 'Filter movements by warehouse, product, transport order or other criteria.'}
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(search) => updateFilters({ search })}
            searchPlaceholder="Search by movement, warehouse, product, quantity or ID"
            onRefresh={() => { void stockMovementsQuery.refetch(); }}
            refreshDisabled={stockMovementsQuery.isFetching}
            onClearFilters={clearFilters}
            clearDisabled={stockMovementsQuery.isFetching || !hasActiveFilters}
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

              {activeTab !== 'approvals' ? (
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={filters.status}
                  onChange={(event) => updateFilters({ status: event.target.value as StockMovementFiltersState['status'] })}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  {stockMovementStatusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              ) : null}

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
        }
      />
    </>
  );
}
