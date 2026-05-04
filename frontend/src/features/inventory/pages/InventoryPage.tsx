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
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { inventoryApi } from '../api/inventoryApi';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import { useInventory } from '../hooks/useInventory';
import { useDeleteInventoryRecord } from '../hooks/useInventoryMutations';
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
  const rows = inventoryQuery.data?.content ?? [];
  const deleteInventoryMutation = useDeleteInventoryRecord();

  const isLoadingLookups = warehousesQuery.isLoading || productsQuery.isLoading;
  const hasLookupError = warehousesQuery.isError || productsQuery.isError;

  const statusOverviewItems = useMemo(
    () => ['LOW_STOCK', 'SUFFICIENT'].map((status) => ({
      value: status,
      count: rows.filter((row) => row.derivedStatus === status).length,
    })),
    [rows],
  );

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

    setFilters((current) => {
      const nextWarehouseId = warehouseId && Number.isFinite(Number(warehouseId)) ? Number(warehouseId) : current.warehouseId;
      const nextProductId = productId && Number.isFinite(Number(productId)) ? Number(productId) : current.productId;

      if (nextWarehouseId === current.warehouseId && nextProductId === current.productId) {
        return current;
      }

      return {
        ...current,
        warehouseId: nextWarehouseId,
        productId: nextProductId,
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
                  ]);
                }}
              />
            </FilterPanel>
          </>
        }
        summary={<StatusOverview items={statusOverviewItems} />}
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
              ]);
            }}
            onEdit={(row) => navigate(`/inventory/${row.warehouseId}/${row.productId}/edit`)}
            onDelete={(row) => setDeleteTarget(row)}
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
