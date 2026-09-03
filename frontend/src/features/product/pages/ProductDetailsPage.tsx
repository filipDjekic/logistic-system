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
import { parsePositiveIntegerId } from '../../../core/utils/routeParams';
import { productsApi } from '../api/productsApi';
import type { WarehouseInventoryResponse } from '../../inventory/types/inventory.types';
import type { TransportOrderItemResponse } from '../../transport-orders/types/transportOrder.types';
import type { DataTableColumn } from '../../../shared/types/common.types';

type ProductDetailsTab = 'overview' | 'inventoryByWarehouse' | 'stockMovements' | 'transportUsage' | 'attachments' | 'comments' | 'audit' | 'history';

function ProductInventoryByWarehouse({ productId }: { productId: number }) {
  const query = useQuery({ queryKey: ['products', productId, 'inventory-by-warehouse'], queryFn: () => productsApi.getInventoryByWarehouse(productId), staleTime: 30_000 });
  const columns: DataTableColumn<WarehouseInventoryResponse>[] = [
    { id: 'warehouse', header: 'Warehouse', minWidth: 220, render: (row) => <Button component={RouterLink} to={`/warehouses/${row.warehouseId}`} size="small">{row.warehouseName ?? `Warehouse #${row.warehouseId}`}</Button> },
    { id: 'quantity', header: 'Quantity', accessor: 'quantity' }, { id: 'reservedQuantity', header: 'Reserved', accessor: 'reservedQuantity' },
    { id: 'availableQuantity', header: 'Available', accessor: 'availableQuantity' }, { id: 'minStockLevel', header: 'Min stock', accessor: 'minStockLevel' },
  ];
  return <SectionCard title="Inventory by warehouse" description="Warehouse-level stock, reservations and availability for this product."><DataTable rows={query.data ?? []} columns={columns} getRowId={(row) => row.warehouseId} loading={query.isLoading} error={query.isError} onRetry={() => void query.refetch()} emptyTitle="No warehouse inventory" emptyDescription="This product is not currently recorded in warehouse inventory." minWidth={780} /></SectionCard>;
}

function ProductStockMovements({ productId }: { productId: number }) {
  const query = useQuery({ queryKey: ['products', productId, 'stock-movements'], queryFn: () => productsApi.getStockMovements(productId, { page: 0, size: 20, sort: 'createdAt,desc' }), staleTime: 20_000 });
  return <SectionCard title="Stock movements" description="Inbound, outbound, transfers, adjustments and reservations for this product."><StockMovementsTable rows={query.data?.content ?? []} loading={query.isLoading} error={query.isError} onRetry={() => void query.refetch()} /></SectionCard>;
}

function ProductTransportUsage({ productId }: { productId: number }) {
  const query = useQuery({ queryKey: ['products', productId, 'transport-usage'], queryFn: () => productsApi.getTransportUsage(productId), staleTime: 30_000 });
  const columns: DataTableColumn<TransportOrderItemResponse>[] = [
    { id: 'transportOrder', header: 'Transport order', render: (row) => <Button component={RouterLink} to={`/transport-orders/${row.transportOrderId}`} size="small">Transport #{row.transportOrderId}</Button> },
    { id: 'quantity', header: 'Requested', accessor: 'quantity' }, { id: 'reservedQuantity', header: 'Reserved', accessor: 'reservedQuantity' },
    { id: 'dispatchedQuantity', header: 'Dispatched', accessor: 'dispatchedQuantity' }, { id: 'deliveredQuantity', header: 'Delivered', accessor: 'deliveredQuantity' },
    { id: 'weight', header: 'Weight', accessor: 'weight' }, { id: 'note', header: 'Note', accessor: 'note' },
  ];
  return <SectionCard title="Transport usage" description="Transport order items where this product is reserved, dispatched or delivered."><DataTable rows={query.data?.content ?? []} columns={columns} getRowId={(row) => row.id} loading={query.isLoading} error={query.isError} onRetry={() => void query.refetch()} emptyTitle="No transport usage" emptyDescription="This product is not used in transport order items." minWidth={980} /></SectionCard>;
}

export default function ProductDetailsPage() {
  const validProductId = parsePositiveIntegerId(useParams().id);
  const productId = validProductId ?? Number.NaN;
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const [activeTab, setActiveTab] = useState<ProductDetailsTab>('overview');
  const query = useProduct(validProductId);
  const archive = useMutation({ mutationFn: productsApi.archive, onSuccess: async () => { showSnackbar({ message: 'Product archived successfully.', severity: 'success' }); await invalidateProductState(queryClient, productId); }, onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }) });
  const restore = useMutation({ mutationFn: productsApi.restore, onSuccess: async () => { showSnackbar({ message: 'Product restored successfully.', severity: 'success' }); await invalidateProductState(queryClient, productId); }, onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }) });
  if (validProductId == null) return <ErrorState title="Product unavailable" description="The requested product could not be found." />;
  if (query.isLoading) return <EntityDetailsLayout overline="Catalog" title="Product Details" loading loadingText="Loading product details..." actionItems={[{ key: 'back', label: 'Back to list', to: '/products' }]}><></></EntityDetailsLayout>;
  if (query.isError || !query.data) return <ErrorState title="Product could not be loaded" description="The requested product details are not available." onRetry={() => void query.refetch()} />;
  const product = query.data;
  const operational = { entityType: 'PRODUCT' as const, entityName: 'PRODUCT', entityId: product.id, allowCreateAttachments: product.active, allowCreateComments: product.active };
  const tabs = [{ value: 'overview', label: 'Overview' }, { value: 'inventoryByWarehouse', label: 'Inventory by warehouse' }, { value: 'stockMovements', label: 'Stock movements' }, { value: 'transportUsage', label: 'Transport usage' }, ...buildOperationalTabs(operational)];
  return <EntityDetailsLayout overline="Catalog" title={product.name} description={`SKU ${product.sku}`} tabs={tabs} activeTab={activeTab} onTabChange={(value) => setActiveTab(value as ProductDetailsTab)} actionItems={[
    product.active ? { key: 'archive', label: 'Archive', color: 'warning', disabled: archive.isPending, onClick: () => archive.mutate(product.id) } : { key: 'restore', label: 'Restore', variant: 'contained', color: 'success', disabled: restore.isPending, onClick: () => restore.mutate(product.id) }, { key: 'back', label: 'Back to list', to: '/products' },
  ]}>
    {!product.active ? <ArchivedEntityAlert entityLabel="Product" /> : null}
    {activeTab === 'overview' ? <><DetailsOverviewCard title="Product overview" description="Catalog attributes and lifecycle status." fields={[
      { label: 'Unit', value: <Chip size="small" label={product.unit} /> }, { label: 'Price', value: product.price }, { label: 'Weight', value: product.weight },
      { label: 'Fragile', value: product.fragile ? 'Yes' : 'No' }, { label: 'Status', value: <StatusChip value={product.active ? 'ACTIVE' : 'INACTIVE'} /> }, { label: 'Description', value: product.description, size: { xs: 12 } },
    ]} /><DetailsMetadataCard fields={[{ label: 'Product ID', value: product.id }]} /></> : null}
    {activeTab === 'inventoryByWarehouse' ? <ProductInventoryByWarehouse productId={product.id} /> : null}
    {activeTab === 'stockMovements' ? <ProductStockMovements productId={product.id} /> : null}
    {activeTab === 'transportUsage' ? <ProductTransportUsage productId={product.id} /> : null}
    <OperationalDetailsTabPanels activeTab={activeTab} {...operational} />
  </EntityDetailsLayout>;
}
