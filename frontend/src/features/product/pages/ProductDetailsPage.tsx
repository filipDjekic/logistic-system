import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
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

type ProductDetailsTab = 'overview' | 'inventoryByWarehouse' | 'binDistribution' | 'stockMovements' | 'transportUsage' | 'changeHistory';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

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

export default function ProductDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
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
      <EntityDetailsLayout overline="Catalog" title="Product Details" actions={<Button variant="outlined" onClick={() => navigate('/products')}>Back to list</Button>}>
        <SectionCard><Typography color="text.secondary">Loading product details...</Typography></SectionCard>
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
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Catalog"
      title={product.name}
      description={`Product #${product.id} • SKU ${product.sku}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as ProductDetailsTab)}
      actions={(
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {product.active ? (
            <Button variant="outlined" color="warning" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(product.id)}>Archive</Button>
          ) : (
            <Button variant="contained" color="success" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(product.id)}>Restore</Button>
          )}
          <Button variant="outlined" onClick={() => navigate('/products')}>Back to list</Button>
        </Stack>
      )}
    >
      {!product.active ? <ArchivedEntityAlert entityLabel="Product" /> : null}

      {activeTab === 'overview' ? (
        <SectionCard title="Product overview" description="Catalog identity, logistics attributes and lifecycle status.">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Name" value={product.name} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><InfoRow label="SKU" value={product.sku} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Unit" value={<Chip size="small" label={product.unit} />} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Price" value={product.price} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Weight" value={product.weight} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Fragile" value={product.fragile ? 'Yes' : 'No'} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Stack alignItems="flex-start"><StatusChip value={product.active ? 'ACTIVE' : 'INACTIVE'} /></Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}><InfoRow label="Company" value={product.companyName ?? '—'} /></Grid>
            <Grid size={{ xs: 12 }}><InfoRow label="Description" value={product.description || '—'} /></Grid>
          </Grid>
        </SectionCard>
      ) : null}

      {activeTab === 'inventoryByWarehouse' ? <ProductInventoryByWarehouse productId={product.id} /> : null}
      {activeTab === 'binDistribution' ? <ProductBinDistribution productId={product.id} /> : null}
      {activeTab === 'stockMovements' ? <ProductStockMovements productId={product.id} /> : null}
      {activeTab === 'transportUsage' ? <ProductTransportUsage productId={product.id} /> : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel
          entityName="PRODUCT"
          entityId={product.id}
          title="Product change history"
          description="Audit trail for product data, status and catalog changes."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
