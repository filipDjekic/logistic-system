import { useMemo, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
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
import type {
  InventoryFiltersState,
  InventoryFormValues,
  InventoryListRow,
} from '../types/inventory.types';

export default function InventoryPage() {
  const auth = useAuthStore();

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const [filters, setFilters] = useState<InventoryFiltersState>({
    search: '',
    warehouseId: 'ALL',
    productId: 'ALL',
    status: 'ALL',
  });

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

  const inventoryQuery = useInventory(filters);
  const createInventoryMutation = useCreateInventoryRecord();
  const updateInventoryMutation = useUpdateInventoryRecord();
  const deleteInventoryMutation = useDeleteInventoryRecord();

  const isLoadingLookups = warehousesQuery.isLoading || productsQuery.isLoading;
  const hasLookupError = warehousesQuery.isError || productsQuery.isError;

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

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
        description="The page aggregates inventory per warehouse using current backend endpoints."
      >
        <Stack spacing={2}>
          <Alert severity="info">
            Inventory status on this page is a UI-derived state based on confirmed backend low-stock logic:
            quantity less than or equal to min stock level.
          </Alert>

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

          <InventoryTable
            rows={inventoryQuery.data ?? []}
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