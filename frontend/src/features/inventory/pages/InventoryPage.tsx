import { useMemo, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { inventoryApi } from '../api/inventoryApi';
import InventoryFilters from '../components/InventoryFilters';
import InventoryTable from '../components/InventoryTable';
import { useInventory } from '../hooks/useInventory';
import type { InventoryFiltersState } from '../types/inventory.types';

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFiltersState>({
    search: '',
    warehouseId: 'ALL',
    productId: 'ALL',
    status: 'ALL',
  });

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

  const isLoadingLookups = warehousesQuery.isLoading || productsQuery.isLoading;
  const hasLookupError = warehousesQuery.isError || productsQuery.isError;

  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Inventory"
        title="Inventory"
        description="Review stock levels by warehouse and product using confirmed backend inventory records."
      />

      <SectionCard
        title="Inventory overview"
        description="The current backend has no single all-records inventory endpoint, so this page aggregates inventory per warehouse."
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
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}