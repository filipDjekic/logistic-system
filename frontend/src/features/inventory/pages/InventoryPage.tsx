import { useEffect, useMemo, useState } from 'react';
import { Button, Stack } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import StatusOverview from '../../../shared/components/StatusOverview/StatusOverview';
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { inventoryApi } from '../api/inventoryApi';
import InventoryFilters from '../components/InventoryFilters';
import InventoryFormDialog from '../components/InventoryFormDialog';
import InventoryTable from '../components/InventoryTable';
import { useInventory } from '../hooks/useInventory';
import {
  useCreateInventoryRecord,
  useDeleteInventoryRecord,
  useUpdateInventoryRecord,
} from '../hooks/useInventoryMutations';
import type { SortState } from '../../../shared/types/common.types';
import type {
  InventoryFiltersState,
  InventoryFormValues,
  InventoryListRow,
} from '../types/inventory.types';

export default function InventoryPage() {
  const auth = useAuthStore();
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

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<InventoryListRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryListRow | null>(null);

  const warehousesQuery = useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: inventoryApi.getWarehouses,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: inventoryApi.getProducts,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const inventoryQuery = useInventory({ ...filters, page, size, sort: buildSortParam(sort) }, { warehouses, products });
  const rows = inventoryQuery.data?.content ?? [];

  const statusOverviewItems = useMemo(
    () => ['LOW_STOCK', 'SUFFICIENT'].map((status) => ({
      value: status,
      count: rows.filter((row) => row.derivedStatus === status).length,
    })),
    [rows],
  );
  const createInventoryMutation = useCreateInventoryRecord();
  const updateInventoryMutation = useUpdateInventoryRecord();
  const deleteInventoryMutation = useDeleteInventoryRecord();

  const isLoadingLookups = warehousesQuery.isLoading || productsQuery.isLoading;
  const hasLookupError = warehousesQuery.isError || productsQuery.isError;

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
    if (searchParams.get('create') !== '1' || !canManage || isLoadingLookups || hasSetupBlockers || dialogOpen) {
      return;
    }

    setDialogMode('create');
    setSelectedRecord(null);
    setDialogOpen(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
  }, [canManage, dialogOpen, hasSetupBlockers, isLoadingLookups, searchParams, setSearchParams]);

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
              onClick={() => {
                setDialogMode('create');
                setSelectedRecord(null);
                setDialogOpen(true);
              }}
            >
              Create inventory record
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Inventory overview"
        description="Inventory search and filters are applied on the backend."
      >
        <Stack spacing={2}>
          {canManage && !isLoadingLookups ? (
            <SetupGuide
              title="Inventory setup is incomplete"
              description="Create the required warehouse and product data before adding stock records."
              items={setupItems}
            />
          ) : null}

          <InventoryFilters
            value={filters}
            warehouses={warehouses}
            products={products}
            loading={inventoryQuery.isFetching || isLoadingLookups}
            onChange={setFilters}
            onRefresh={() => {
              void Promise.all([
                warehousesQuery.refetch(),
                productsQuery.refetch(),
                inventoryQuery.refetch(),
              ]);
            }}
          />

          <StatusOverview items={statusOverviewItems} />

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
            onEdit={(row) => {
              setDialogMode('edit');
              setSelectedRecord(row);
              setDialogOpen(true);
            }}
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
        </Stack>
      </SectionCard>

      {canManage ? (
        <InventoryFormDialog
          open={dialogOpen}
          mode={dialogMode}
          initialData={selectedRecord}
          warehouses={warehouses}
          products={products}
          loading={
            createInventoryMutation.isPending ||
            updateInventoryMutation.isPending ||
            warehousesQuery.isLoading ||
            productsQuery.isLoading
          }
          onClose={() => setDialogOpen(false)}
          onSubmit={(values: InventoryFormValues) => {
            if (dialogMode === 'create') {
              createInventoryMutation.mutate(
                {
                  warehouseId: Number(values.warehouseId),
                  productId: Number(values.productId),
                  quantity: Number(values.quantity),
                  minStockLevel: Number(values.minStockLevel),
                },
                {
                  onSuccess: () => {
                    setDialogOpen(false);
                  },
                },
              );
              return;
            }

            if (!selectedRecord) {
              return;
            }

            updateInventoryMutation.mutate(
              {
                warehouseId: selectedRecord.warehouseId,
                productId: selectedRecord.productId,
                data: {
                  warehouseId: selectedRecord.warehouseId,
                  productId: selectedRecord.productId,
                  quantity: Number(values.quantity),
                  minStockLevel: Number(values.minStockLevel),
                },
              },
              {
                onSuccess: () => {
                  setDialogOpen(false);
                  setSelectedRecord(null);
                },
              },
            );
          }}
        />
      ) : null}

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