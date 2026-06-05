import { useEffect, useMemo, useState } from 'react';
import { Button, Stack } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import StatusOverview from '../../../shared/components/StatusOverview/StatusOverview';
import OperationalMetrics from '../../../shared/components/OperationalMetrics/OperationalMetrics';
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { inventoryApi } from '../api/inventoryApi';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import InventoryReservationDialog from '../components/InventoryReservationDialog';
import { useInventory } from '../hooks/useInventory';
import {
  useDeleteInventoryRecord,
  useReleaseInventoryReservation,
  useReserveInventoryStock,
} from '../hooks/useInventoryMutations';
import type { SortState } from '../../../shared/types/common.types';
import type { InventoryFiltersState, InventoryListRow } from '../types/inventory.types';

export default function InventoryPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const [filters, setFilters] = useState<InventoryFiltersState>({
    search: '',
    warehouseId: 'ALL',
    productId: 'ALL',
    status: 'ALL',
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'quantity', direction: 'desc' });
  const [deleteTarget, setDeleteTarget] = useState<InventoryListRow | null>(null);
  const [reservationTarget, setReservationTarget] = useState<InventoryListRow | null>(null);
  const [reservationMode, setReservationMode] = useState<'reserve' | 'release'>('reserve');

  const warehousesQuery = useQuery({
    queryKey: queryKeys.inventory.warehouses(),
    queryFn: inventoryApi.getWarehouses,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.inventory.products(),
    queryFn: inventoryApi.getProducts,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const inventoryQuery = useInventory(
    { ...filters, page, size, sort: buildSortParam(sort) },
    { warehouses, products },
  );
  const inventoryStatusCountsQuery = useQuery({
    queryKey: queryKeys.inventory.statusCounts(filters),
    queryFn: () => inventoryApi.getStatusCounts(filters),
    staleTime: 30_000,
  });
  const rows = inventoryQuery.data?.content ?? [];
  const deleteInventoryMutation = useDeleteInventoryRecord();
  const reserveInventoryMutation = useReserveInventoryStock();
  const releaseReservationMutation = useReleaseInventoryReservation();

  const isLoadingLookups = warehousesQuery.isLoading || productsQuery.isLoading;
  const hasLookupError = warehousesQuery.isError || productsQuery.isError;

  const statusOverviewItems = useMemo(
    () => {
      const counts = inventoryStatusCountsQuery.data;

      if (counts) {
        return counts.map((item) => ({ value: item.status, count: item.count }));
      }

      return ['LOW_STOCK', 'RESERVED', 'OUT_OF_STOCK', 'AVAILABLE', 'SUFFICIENT'].map((status) => ({
        value: status,
        count: rows.filter((row) => row.derivedStatus === status).length,
      }));
    },
    [inventoryStatusCountsQuery.data, rows],
  );

  const inventoryMetrics = useMemo(() => {
    const totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
    const reservedQuantity = rows.reduce((sum, row) => sum + Number(row.reservedQuantity ?? 0), 0);
    const availableQuantity = rows.reduce((sum, row) => sum + Number(row.availableQuantity ?? 0), 0);
    const reservedRows = rows.filter((row) => Number(row.reservedQuantity ?? 0) > 0).length;
    const lowStockRows = rows.filter((row) => row.derivedStatus === 'LOW_STOCK').length;
    const outOfStockRows = rows.filter((row) => row.derivedStatus === 'OUT_OF_STOCK').length;
    const reservationRate = totalQuantity > 0 ? Math.round((reservedQuantity / totalQuantity) * 100) : 0;

    return [
      {
        label: 'Available stock',
        value: availableQuantity.toLocaleString(),
        helper: `${reservedQuantity.toLocaleString()} reserved from ${totalQuantity.toLocaleString()} total`,
        tone: availableQuantity > 0 ? 'success' as const : 'error' as const,
        status: availableQuantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      },
      {
        label: 'Reservation rate',
        value: `${reservationRate}%`,
        helper: `${reservedRows} rows currently have reserved stock`,
        tone: reservedQuantity > 0 ? 'info' as const : 'neutral' as const,
        status: reservedQuantity > 0 ? 'RESERVED' : null,
      },
      {
        label: 'Low stock rows',
        value: lowStockRows,
        helper: `${outOfStockRows} rows are out of stock on current page`,
        tone: lowStockRows > 0 ? 'warning' as const : 'success' as const,
        status: lowStockRows > 0 ? 'LOW_STOCK' : 'SUFFICIENT',
      },
    ];
  }, [rows]);

  const setupItems = [
    {
      title: 'Create at least one warehouse',
      description: 'Inventory records must belong to a warehouse.',
      done: !canManage || isLoadingLookups || warehouses.length > 0,
      action: { label: 'Open warehouses', to: '/warehouses' },
    },
    {
      title: 'Create at least one product',
      description: 'Inventory records must be connected to a product catalog item.',
      done: !canManage || isLoadingLookups || products.length > 0,
      action: { label: 'Open products', to: '/products' },
    },
  ];

  const hasSetupBlockers = setupItems.some((item) => !item.done);

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
    const status = searchParams.get('status');

    setFilters((current) => {
      const nextWarehouseId = warehouseId && Number.isFinite(Number(warehouseId)) ? Number(warehouseId) : current.warehouseId;
      const nextProductId = productId && Number.isFinite(Number(productId)) ? Number(productId) : current.productId;
      const nextStatus = status === 'LOW_STOCK' || status === 'RESERVED' || status === 'OUT_OF_STOCK' || status === 'AVAILABLE' || status === 'SUFFICIENT' ? status : current.status;

      if (nextWarehouseId === current.warehouseId && nextProductId === current.productId && nextStatus === current.status) {
        return current;
      }

      return {
        ...current,
        warehouseId: nextWarehouseId,
        productId: nextProductId,
        status: nextStatus,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('create') !== '1' || !canManage || isLoadingLookups || hasSetupBlockers) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
    navigate('/inventory/create');
  }, [canManage, hasSetupBlockers, isLoadingLookups, navigate, searchParams, setSearchParams]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Inventory"
        title="Inventory"
        description="Company admin has read-only visibility here. Inventory manipulation remains an operational warehouse responsibility."
        actions={
          canManage ? (
            <Button
              variant="contained"
              disabled={hasSetupBlockers}
              onClick={() => navigate('/inventory/create')}
            >
              Create inventory record
            </Button>
          ) : null
        }
      />

      <OperationalMetrics items={inventoryMetrics} />

      <TableLayout
        title="Inventory overview"
        description="Inventory search and filters are applied on the backend."
        filters={
          <>
            {canManage && !isLoadingLookups ? (
              <SetupGuide
                title="Inventory setup is incomplete"
                description="Create the required warehouse and product data before adding stock records."
                items={setupItems}
              />
            ) : null}

            <FilterPanel>
              <InventoryFilters
                value={filters}
                loading={inventoryQuery.isFetching || isLoadingLookups}
                onChange={(nextFilters) => {
                  setPage(0);
                  setFilters(nextFilters);
                }}
                onRefresh={() => {
                  void Promise.all([
                    warehousesQuery.refetch(),
                    productsQuery.refetch(),
                    inventoryQuery.refetch(),
                    inventoryStatusCountsQuery.refetch(),
                  ]);
                }}
              />
            </FilterPanel>
          </>
        }
        summary={<StatusOverview items={statusOverviewItems} title="Filtered result status" />}
        table={
          <InventoryTable
            rows={rows}
            loading={inventoryQuery.isLoading || isLoadingLookups}
            error={inventoryQuery.isError || hasLookupError}
            onRetry={() => {
              void Promise.all([
                warehousesQuery.refetch(),
                productsQuery.refetch(),
                inventoryQuery.refetch(),
                inventoryStatusCountsQuery.refetch(),
              ]);
            }}
            onEdit={(row) => navigate(`/inventory/${row.warehouseId}/${row.productId}/edit`)}
            onDelete={(row) => setDeleteTarget(row)}
            onReserve={(row) => {
              setReservationMode('reserve');
              setReservationTarget(row);
            }}
            onReleaseReservation={(row) => {
              setReservationMode('release');
              setReservationTarget(row);
            }}
            canManage={canManage}
            pagination={
              <ServerTablePagination
                page={inventoryQuery.data}
                disabled={inventoryQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
            sort={sort}
            onSortChange={handleSortChange}
          />
        }
      />


      <InventoryReservationDialog
        open={reservationTarget !== null}
        mode={reservationMode}
        row={reservationTarget}
        loading={reserveInventoryMutation.isPending || releaseReservationMutation.isPending}
        onClose={() => setReservationTarget(null)}
        onSubmit={({ quantity, note }) => {
          if (!reservationTarget) {
            return;
          }

          const payload = {
            warehouseId: reservationTarget.warehouseId,
            productId: reservationTarget.productId,
            quantity,
            note,
          };

          const mutation = reservationMode === 'reserve'
            ? reserveInventoryMutation
            : releaseReservationMutation;

          mutation.mutate(payload, {
            onSuccess: () => setReservationTarget(null),
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete inventory record"
        description={
          deleteTarget
            ? `Are you sure you want to delete inventory for "${deleteTarget.productName}" in "${deleteTarget.warehouseName}"?`
            : ''
        }
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteInventoryMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteInventoryMutation.mutate(
            {
              warehouseId: deleteTarget.warehouseId,
              productId: deleteTarget.productId,
            },
            {
              onSuccess: () => {
                setDeleteTarget(null);
              },
            },
          );
        }}
      />
    </Stack>
  );
}
