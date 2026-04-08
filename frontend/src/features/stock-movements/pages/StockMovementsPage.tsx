import { useMemo, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { stockMovementsApi } from '../api/stockMovementsApi';
import StockMovementFormDialog from '../components/StockMovementFormDialog';
import StockMovementsTable from '../components/StockMovementsTable';
import {
  useCreateStockMovement,
  useStockMovements,
} from '../hooks/useStockMovements';
import type {
  StockMovementFiltersState,
  StockMovementProductOption,
  StockMovementResponse,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';
import { stockMovementTypeOptions } from '../validation/stockMovementSchema';

export default function StockMovementsPage() {
  const [filters, setFilters] = useState<StockMovementFiltersState>({
    search: '',
    movementType: 'ALL',
    warehouseId: 'ALL',
    productId: 'ALL',
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const stockMovementsQuery = useStockMovements(true);
  const createStockMovementMutation = useCreateStockMovement();

  const warehousesQuery = useQuery({
    queryKey: ['stock-movements', 'warehouses'],
    queryFn: stockMovementsApi.getWarehouses,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useQuery({
    queryKey: ['stock-movements', 'products'],
    queryFn: stockMovementsApi.getProducts,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useQuery({
    queryKey: ['stock-movements', 'transport-orders'],
    queryFn: stockMovementsApi.getTransportOrders,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const warehousesById = useMemo<Record<number, StockMovementWarehouseOption>>(
    () =>
      (warehousesQuery.data ?? []).reduce<Record<number, StockMovementWarehouseOption>>(
        (acc, warehouse) => {
          acc[warehouse.id] = warehouse;
          return acc;
        },
        {},
      ),
    [warehousesQuery.data],
  );

  const productsById = useMemo<Record<number, StockMovementProductOption>>(
    () =>
      (productsQuery.data ?? []).reduce<Record<number, StockMovementProductOption>>(
        (acc, product) => {
          acc[product.id] = product;
          return acc;
        },
        {},
      ),
    [productsQuery.data],
  );

  const transportOrdersById = useMemo<
    Record<number, StockMovementTransportOrderOption>
  >(
    () =>
      (transportOrdersQuery.data ?? []).reduce<
        Record<number, StockMovementTransportOrderOption>
      >((acc, order) => {
        acc[order.id] = order;
        return acc;
      }, {}),
    [transportOrdersQuery.data],
  );

  const filteredRows = useMemo<StockMovementResponse[]>(() => {
    const rows = stockMovementsQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesMovementType =
        filters.movementType === 'ALL' || row.movementType === filters.movementType;
      const matchesWarehouse =
        filters.warehouseId === 'ALL' || row.warehouseId === filters.warehouseId;
      const matchesProduct =
        filters.productId === 'ALL' || row.productId === filters.productId;

      if (!matchesMovementType || !matchesWarehouse || !matchesProduct) {
        return false;
      }

      if (!search) {
        return true;
      }

      const warehouse = warehousesById[row.warehouseId];
      const product = productsById[row.productId];
      const transportOrder =
        row.transportOrderId !== null
          ? transportOrdersById[row.transportOrderId]
          : undefined;

      return [
        row.movementType,
        row.reasonCode,
        row.referenceType,
        row.reasonDescription,
        row.referenceNumber,
        row.referenceNote,
        warehouse?.name,
        warehouse?.city,
        product?.name,
        product?.sku,
        transportOrder?.orderNumber,
        String(row.id),
        String(row.referenceId ?? ''),
        String(row.createdById),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [
    filters,
    productsById,
    stockMovementsQuery.data,
    transportOrdersById,
    warehousesById,
  ]);

  const hasLookupError =
    warehousesQuery.isError ||
    productsQuery.isError ||
    transportOrdersQuery.isError;

  const isLookupsLoading =
    warehousesQuery.isLoading ||
    productsQuery.isLoading ||
    transportOrdersQuery.isLoading;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Inventory"
        title="Stock Movements"
        description="Review inbound, outbound, transfer, and adjustment inventory movements."
        actions={
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Create stock movement
          </Button>
        }
      />

      <SectionCard
        title="Movement history"
        description="The backend currently confirms list and create operations for stock movements."
      >
        <Stack spacing={2}>
          <Alert severity="info">
            This page is based on confirmed backend stock movement fields and rules.
            Manual actions currently mean create only, because the backend exposes
            `GET /api/stock_movements`, `GET /api/stock_movements/{`{id}`}` and
            `POST /api/stock_movements`.
          </Alert>

          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by movement, reason, warehouse, product, reference or ID"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Movement type"
              value={filters.movementType}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  movementType: event.target.value as StockMovementFiltersState['movementType'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {stockMovementTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Warehouse"
              value={filters.warehouseId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  warehouseId:
                    event.target.value === 'ALL'
                      ? 'ALL'
                      : Number(event.target.value),
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {(warehousesQuery.data ?? []).map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Product"
              value={filters.productId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  productId:
                    event.target.value === 'ALL'
                      ? 'ALL'
                      : Number(event.target.value),
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {(productsQuery.data ?? []).map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void Promise.all([
                  stockMovementsQuery.refetch(),
                  warehousesQuery.refetch(),
                  productsQuery.refetch(),
                  transportOrdersQuery.refetch(),
                ]);
              }}
              disabled={
                stockMovementsQuery.isFetching ||
                warehousesQuery.isFetching ||
                productsQuery.isFetching ||
                transportOrdersQuery.isFetching
              }
            >
              Refresh
            </Button>
          </Stack>

          <StockMovementsTable
            rows={filteredRows}
            warehousesById={warehousesById}
            productsById={productsById}
            transportOrdersById={transportOrdersById}
            loading={stockMovementsQuery.isLoading || isLookupsLoading}
            error={stockMovementsQuery.isError || hasLookupError}
            onRetry={() => {
              void Promise.all([
                stockMovementsQuery.refetch(),
                warehousesQuery.refetch(),
                productsQuery.refetch(),
                transportOrdersQuery.refetch(),
              ]);
            }}
          />
        </Stack>
      </SectionCard>

      <StockMovementFormDialog
        open={dialogOpen}
        warehouses={warehousesQuery.data ?? []}
        products={productsQuery.data ?? []}
        transportOrders={transportOrdersQuery.data ?? []}
        loading={
          createStockMovementMutation.isPending ||
          warehousesQuery.isLoading ||
          productsQuery.isLoading ||
          transportOrdersQuery.isLoading
        }
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => {
          createStockMovementMutation.mutate(
            {
              movementType: values.movementType,
              quantity: Number(values.quantity),
              reasonCode: values.reasonCode,
              reasonDescription: values.reasonDescription?.trim() || undefined,
              referenceType: values.referenceType,
              referenceId: values.referenceId ?? undefined,
              referenceNumber: values.referenceNumber?.trim() || undefined,
              referenceNote: values.referenceNote?.trim() || undefined,
              transportOrderId: values.transportOrderId ?? undefined,
              warehouseId: Number(values.warehouseId),
              productId: Number(values.productId),
            },
            {
              onSuccess: () => setDialogOpen(false),
            },
          );
        }}
      />
    </Stack>
  );
}