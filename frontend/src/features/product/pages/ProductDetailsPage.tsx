import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Button, Chip } from '@mui/material';
import { EntityDetailsLayout, DetailsOverviewCard, DetailsMetadataCard, OperationalDetailsTabPanels, buildOperationalTabs } from '../../../shared/components/EntityDetails';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StockMovementsTable from '../../stock-movements/components/StockMovementsTable';
import { useProduct } from '../hooks/useProduct';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { invalidateProductState } from '../../../core/utils/invalidateAppState';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { productsApi } from '../api/productsApi';
import type { WarehouseInventoryResponse } from '../../inventory/types/inventory.types';
import type { BinInventoryResponse } from '../../warehouse-locations/types/warehouseLocation.types';
import type { TransportOrderItemResponse } from '../../transport-orders/types/transportOrder.types';
import type { DataTableColumn } from '../../../shared/types/common.types';

type ProductDetailsTab = 'overview' | 'inventoryByWarehouse' | 'binDistribution' | 'stockMovements' | 'transportUsage' | 'attachments' | 'comments' | 'audit' | 'history';

function ProductInventoryByWarehouse({ productId }: { productId: number }) {
  const query = useQuery({
    queryKey: ['products', productId, 'inventory-by-warehouse'],
    queryFn: () => productsApi.getInventoryByWarehouse(productId),
    staleTime: 30_000,
  });

  const columns: DataTableColumn<WarehouseInventoryResponse>[] = [
    {
      id: 'warehouse',
      header: 'Warehouse',
      minWidth: 220,
      render: (row) => (
        <Button component={RouterLink} to={`/warehouses/${row.warehouseId}`} size="small">
          {row.warehouseName ?? `Warehouse #${row.warehouseId}`}
        </Button>
      ),
    },
    { id: 'quantity', header: 'Quantity', accessor: 'quantity', minWidth: 120 },
    { id: 'reservedQuantity', header: 'Reserved', accessor: 'reservedQuantity', minWidth: 120 },
    { id: 'availableQuantity', header: 'Available', accessor: 'availableQuantity', minWidth: 120 },
    { id: 'minStockLevel', header: 'Min stock', accessor: 'minStockLevel', minWidth: 120 },
  ];

  return (
    <SectionCard title="Inventory by warehouse" description="Warehouse-level stock, reservations and availability for this product.">
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        getRowId={(row) => row.warehouseId}
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyTitle="No warehouse inventory"
        emptyDescription="This product is not currently recorded in warehouse inventory."
        minWidth={780}
      />
    </SectionCard>
  );
}

function ProductBinDistribution({ productId }: { productId: number }) {
  const query = useQuery({
    queryKey: ['products', productId, 'bin-distribution'],
    queryFn: () => productsApi.getBinDistribution(productId),
    staleTime: 30_000,
  });

  const rows = query.data?.content ?? [];
  const columns: DataTableColumn<BinInventoryResponse>[] = [
    {
      id: 'warehouse',
      header: 'Warehouse',
      minWidth: 200,
      render: (row) => (
        <Button component={RouterLink} to={`/warehouses/${row.warehouseId}`} size="small">
          {row.warehouseName ?? `Warehouse #${row.warehouseId}`}
        </Button>
      ),
    },
    {
      id: 'zone',
      header: 'Zone',
      minWidth: 160,
      render: (row) => (
        <Button component={RouterLink} to={`/warehouses/${row.warehouseId}/zones/${row.zoneId}`} size="small">
          {row.zoneCode}
        </Button>
      ),
    },
    {
      id: 'bin',
      header: 'Bin',
      minWidth: 180,
      render: (row) => (
        <Button component={RouterLink} to={`/warehouses/${row.warehouseId}/zones/${row.zoneId}/bins/${row.binLocationId}`} size="small">
          {row.binLocationCode}
        </Button>
      ),
    },
    { id: 'binName', header: 'Bin name', accessor: 'binLocationName', minWidth: 180 },
    { id: 'quantity', header: 'Quantity', accessor: 'quantity', minWidth: 120 },
    { id: 'lastUpdated', header: 'Last updated', minWidth: 180, render: (row) => row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '—' },
  ];

  return (
    <SectionCard title="Bin distribution" description="Physical bin-level distribution for this product.">
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => `${row.binLocationId}-${row.productId}`}
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyTitle="No bin distribution"
        emptyDescription="This product has no recorded bin inventory."
        minWidth={1020}
      />
    </SectionCard>
  );
}

function ProductStockMovements({ productId }: { productId: number }) {
  const query = useQuery({
    queryKey: ['products', productId, 'stock-movements'],
    queryFn: () => productsApi.getStockMovements(productId, { page: 0, size: 20, sort: 'createdAt,desc' }),
    staleTime: 20_000,
  });

  return (
    <SectionCard title="Stock movements" description="Inbound, outbound, transfers, adjustments and reservations for this product.">
      <StockMovementsTable
        rows={query.data?.content ?? []}
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
      />
    </SectionCard>
  );
}

function ProductTransportUsage({ productId }: { productId: number }) {
  const query = useQuery({
    queryKey: ['products', productId, 'transport-usage'],
    queryFn: () => productsApi.getTransportUsage(productId),
    staleTime: 30_000,
  });

  const columns: DataTableColumn<TransportOrderItemResponse>[] = [
    {
      id: 'transportOrder',
      header: 'Transport order',
      minWidth: 180,
      render: (row) => (
        <Button component={RouterLink} to={`/transport-orders/${row.transportOrderId}`} size="small">
          Transport #{row.transportOrderId}
        </Button>
      ),
    },
    { id: 'quantity', header: 'Requested', accessor: 'quantity', minWidth: 120 },
    { id: 'reservedQuantity', header: 'Reserved', accessor: 'reservedQuantity', minWidth: 120 },
    { id: 'dispatchedQuantity', header: 'Dispatched', accessor: 'dispatchedQuantity', minWidth: 120 },
    { id: 'deliveredQuantity', header: 'Delivered', accessor: 'deliveredQuantity', minWidth: 120 },
    { id: 'weight', header: 'Weight', accessor: 'weight', minWidth: 120 },
    { id: 'note', header: 'Note', accessor: 'note', minWidth: 220 },
  ];

  return (
    <SectionCard title="Transport usage" description="Transport order items where this product is reserved, dispatched or delivered.">
      <DataTable
        rows={query.data?.content ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyTitle="No transport usage"
        emptyDescription="This product is not used in transport order items."
        minWidth={980}
      />
    </SectionCard>
  );
}

export default function ProductDetailsPage() {  const params = useParams();
  const productId = Number(params.id);
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const [activeTab, setActiveTab] = useState<ProductDetailsTab>('overview');

  const productQuery = useProduct(Number.isFinite(productId) ? productId : null);

  const archiveMutation = useMutation({
    mutationFn: (id: number) => productsApi.archive(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Product archived successfully.', severity: 'success' });
      await invalidateProductState(queryClient, productId);
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => productsApi.restore(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Product restored successfully.', severity: 'success' });
      await invalidateProductState(queryClient, productId);
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  if (!Number.isFinite(productId)) {
    return <ErrorState title="Invalid product" description="The product ID in the route is not valid." />;
  }

  if (productQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Catalog"
        title="Product Details"
        loading
        loadingText="Loading product details..."
        actionItems={[{ key: 'back', label: 'Back to list', to: '/products' }]}
      >
        <></>
      </EntityDetailsLayout>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <ErrorState
        title="Product could not be loaded"
        description="The requested product details are not available."
        onRetry={() => void productQuery.refetch()}
      />
    );
  }

  const product = productQuery.data;
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'inventoryByWarehouse', label: 'Inventory by warehouse' },
    { value: 'binDistribution', label: 'Bin distribution' },
    { value: 'stockMovements', label: 'Stock movements' },
    { value: 'transportUsage', label: 'Transport usage' },
    ...buildOperationalTabs({
      entityType: 'PRODUCT',
      entityName: 'PRODUCT',
      entityId: product.id,
      allowCreateAttachments: product.active,
      allowCreateComments: product.active,
    }),
  ];

  return (
    <EntityDetailsLayout
      overline="Catalog"
      title={product.name}
      description={`Product #${product.id} • SKU ${product.sku}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as ProductDetailsTab)}
      actionItems={[
        product.active
          ? { key: 'archive', label: 'Archive', color: 'warning', disabled: archiveMutation.isPending, onClick: () => archiveMutation.mutate(product.id) }
          : { key: 'restore', label: 'Restore', variant: 'contained', color: 'success', disabled: restoreMutation.isPending, onClick: () => restoreMutation.mutate(product.id) },
        { key: 'back', label: 'Back to list', to: '/products' },
      ]}
    >
      {!product.active ? <ArchivedEntityAlert entityLabel="Product" /> : null}

      {activeTab === 'overview' ? (
        <>
          <DetailsOverviewCard
            title="Product overview"
            description="Catalog identity, logistics attributes and lifecycle status."
            fields={[
              { label: 'Name', value: product.name },
              { label: 'SKU', value: product.sku },
              { label: 'Unit', value: <Chip size="small" label={product.unit} /> },
              { label: 'Price', value: product.price },
              { label: 'Weight', value: product.weight },
              { label: 'Fragile', value: product.fragile ? 'Yes' : 'No' },
              { label: 'Status', value: <StatusChip value={product.active ? 'ACTIVE' : 'INACTIVE'} /> },
              { label: 'Company', value: product.companyName },
              { label: 'Description', value: product.description, size: { xs: 12 } },
            ]}
          />
          <DetailsMetadataCard
            fields={[
              { label: 'Product ID', value: product.id },
              { label: 'Company', value: product.companyName },
            ]}
          />
        </>
      ) : null}

      {activeTab === 'inventoryByWarehouse' ? <ProductInventoryByWarehouse productId={product.id} /> : null}
      {activeTab === 'binDistribution' ? <ProductBinDistribution productId={product.id} /> : null}
      {activeTab === 'stockMovements' ? <ProductStockMovements productId={product.id} /> : null}
      {activeTab === 'transportUsage' ? <ProductTransportUsage productId={product.id} /> : null}

      <OperationalDetailsTabPanels
        activeTab={activeTab}
        entityType="PRODUCT"
        entityName="PRODUCT"
        entityId={product.id}
        allowCreateAttachments={product.active}
        allowCreateComments={product.active}
      />
    </EntityDetailsLayout>
  );
}
