import { useMemo, useState } from 'react';
import { Button, Grid, MenuItem, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import { ProductSearchSelect } from '../../search-select/components/ProductSearchSelect';
import { TransportOrderSearchSelect } from '../../search-select/components/TransportOrderSearchSelect';
import { WarehouseSearchSelect } from '../../search-select/components/WarehouseSearchSelect';
import StockMovementsTable from '../components/StockMovementsTable';
import { useStockMovements } from '../hooks/useStockMovements';
import type { SortState } from '../../../shared/types/common.types';
import type { StockMovementFiltersState } from '../types/stockMovement.types';
import { stockMovementTypeOptions } from '../validation/stockMovementSchema';

export default function StockMovementsPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();

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

  const stockMovementQueryFilters = useMemo(
    () => ({ ...filters, page, size, sort: buildSortParam(sort) }),
    [filters, page, size, sort],
  );

  const stockMovementsQuery = useStockMovements(stockMovementQueryFilters, true);

  const updateFilters = (next: Partial<StockMovementFiltersState>) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const clearFilters = () => {
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

      <TableLayout
        title="Movement history"
        description="Use server-side filters. Warehouse, product and transport filters use search panels instead of loading large dropdown lists."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(search) => updateFilters({ search })}
            searchPlaceholder="Search by movement, warehouse, product, quantity or ID"
            onRefresh={() => void stockMovementsQuery.refetch()}
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

            <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
              <Grid size={{ xs: 12, lg: 4 }}>
                <WarehouseSearchSelect
                  title="Warehouse filter"
                  value={filters.warehouseId === 'ALL' ? null : filters.warehouseId}
                  onSelect={(warehouse) => updateFilters({ warehouseId: warehouse.id })}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <ProductSearchSelect
                  title="Product filter"
                  value={filters.productId === 'ALL' ? null : filters.productId}
                  onSelect={(product) => updateFilters({ productId: product.id })}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <TransportOrderSearchSelect
                  title="Transport order filter"
                  value={filters.transportOrderId === 'ALL' ? null : filters.transportOrderId}
                  onSelect={(transportOrder) => updateFilters({ transportOrderId: transportOrder.id })}
                />
              </Grid>
            </Grid>
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
