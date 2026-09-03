import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Stack } from '@mui/material';
import { normalizeApiError } from '../../../core/api/apiError';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import DataTable from '../../../shared/components/DataTable/DataTable';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import useDetailsPagination from '../../../shared/hooks/useDetailsPagination';
import { DetailsMetadataCard, DetailsOverviewCard, DetailsStatisticsCard, EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import InventoryStatusChip from '../components/InventoryStatusChip';
import { useInventoryRecord } from '../hooks/useInventoryRecord';
import { useStockMovements } from '../../stock-movements/hooks/useStockMovements';

type InventoryDetailsTab = 'overview' | 'stockMovements' | 'activity';

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

function formatMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (value == null) return '—';
  return currency ? `${value} ${currency}` : String(value);
}

export default function InventoryDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const role = useAuthStore().user?.role;
  const isWorker = role === ROLES.WORKER;
  const isOverlord = role === ROLES.OVERLORD;
  const canManage = isOverlord || role === ROLES.WAREHOUSE_MANAGER || isWorker;
  const canCreateStockMovement = isOverlord || role === ROLES.WAREHOUSE_MANAGER;
  const [activeTab, setActiveTab] = useState<InventoryDetailsTab>('overview');
  const movementPage = useDetailsPagination(20);
  const warehouseId = useMemo(() => Number(params.warehouseId), [params.warehouseId]);
  const productId = useMemo(() => Number(params.productId), [params.productId]);
  const valid = Number.isInteger(warehouseId) && warehouseId > 0 && Number.isInteger(productId) && productId > 0;
  const recordQuery = useInventoryRecord(valid ? warehouseId : null, valid ? productId : null);
  const movementsQuery = useStockMovements({ search: '', movementType: 'ALL', warehouseId: valid ? warehouseId : 'ALL', productId: valid ? productId : 'ALL', transportOrderId: 'ALL', fromDate: '', toDate: '', page: movementPage.page, size: movementPage.size, sort: 'createdAt,desc' }, valid && activeTab === 'stockMovements');

  if (!valid) return <ErrorState title="Inventory record unavailable" description="The requested inventory record could not be opened." />;
  if (recordQuery.isLoading) return <InlineLoader message="Loading inventory record..." />;
  if (recordQuery.isError || !recordQuery.data) {
    const error = normalizeApiError(recordQuery.error, 'The requested inventory record was not found or could not be loaded.');
    return <ErrorState title={error.status === 403 ? 'Access denied' : error.status === 404 ? 'Inventory record not found' : 'Inventory record could not be loaded'} description={error.message} details={error.fieldErrors} onRetry={() => void recordQuery.refetch()} />;
  }

  const { record, warehouse, product } = recordQuery.data;
  const recommendation = record.quantity <= record.minStockLevel ? {
    title: 'Replenish or investigate low stock.', description: 'Current quantity is at or below the minimum stock level. Review stock movements before taking action.', severity: 'warning' as const,
    actions: [...(canCreateStockMovement ? [{ label: 'Create stock movement', to: '/stock-movements/create' }] : []), { label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const }],
  } : { title: 'Inventory is ready for operational review.', description: 'Use stock movements to verify how the current warehouse quantity was reached.', severity: 'info' as const, actions: [{ label: 'Open stock movements', onClick: () => setActiveTab('stockMovements'), variant: 'outlined' as const }] };

  return <EntityDetailsLayout overline={isWorker ? 'Assigned inventory' : 'Inventory'} title={`${record.warehouseName} · ${record.productName}`} description="Warehouse-level stock record and movement history." tabs={[
    { value: 'overview', label: 'Overview' }, { value: 'stockMovements', label: `Stock movements${movementsQuery.data ? ` (${movementsQuery.data.totalElements})` : ''}` }, ...(isOverlord ? [{ value: 'activity' as const, label: 'Activity' }] : []),
  ]} activeTab={activeTab} onTabChange={(value) => setActiveTab(value as InventoryDetailsTab)} actions={<Stack direction="row" spacing={1}>{canManage ? <Button variant="contained" onClick={() => navigate(`/inventory/${record.warehouseId}/${record.productId}/edit`)}>Edit</Button> : null}<Button variant="outlined" onClick={() => navigate('/inventory')}>Back to list</Button></Stack>}>
    <RecommendedNextStep {...recommendation} />
    {activeTab === 'overview' ? <Stack spacing={3}>
      {record.quantity <= record.minStockLevel ? <Alert severity="warning">Current quantity is at or below the minimum stock level.</Alert> : null}
      <DetailsStatisticsCard title="Stock position" statistics={[
        { key: 'quantity', title: 'Quantity', value: record.quantity }, { key: 'reserved', title: 'Reserved', value: record.reservedQuantity }, { key: 'available', title: 'Available', value: record.availableQuantity }, { key: 'minimum', title: 'Minimum', value: record.minStockLevel },
      ]} />
      <DetailsOverviewCard title="Inventory overview" fields={[
        { label: 'Warehouse', value: <Button component={RouterLink} to={`/warehouses/${record.warehouseId}`} size="small">{record.warehouseName}</Button> },
        { label: 'Product', value: <Button component={RouterLink} to={`/products/${record.productId}`} size="small">{record.productName}</Button> },
        { label: 'SKU', value: record.productSku }, { label: 'Unit', value: product?.unit }, { label: 'Status', value: <InventoryStatusChip status={record.derivedStatus} /> },
        { label: 'Average unit cost', value: formatMoney(record.averageUnitCost, record.currency) }, { label: 'Total value', value: formatMoney(record.totalValue, record.currency) },
        { label: 'Warehouse address', value: warehouse ? `${warehouse.address}, ${warehouse.city}` : null },
      ]} />
      <DetailsMetadataCard fields={[{ label: 'Record version', value: record.version }]} />
    </Stack> : null}
    {activeTab === 'stockMovements' ? <RelatedDataSection title="Stock movements" description="Movements for this warehouse and product." loading={movementsQuery.isLoading} error={movementsQuery.isError} onRetry={() => void movementsQuery.refetch()} empty={!movementsQuery.isLoading && !movementsQuery.isError && (movementsQuery.data?.content.length ?? 0) === 0} emptyTitle="No stock movements" emptyDescription="No stock movements have been recorded for this inventory record yet.">
      <DataTable columns={[
        { id: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) }, { id: 'type', header: 'Type', accessor: 'movementType' }, { id: 'reason', header: 'Reason', render: (row) => row.reasonCode ?? '—' },
        { id: 'quantity', header: 'Quantity', align: 'right', accessor: 'quantity' }, { id: 'balance', header: 'Balance', render: (row) => `${row.quantityBefore} → ${row.quantityAfter}` }, { id: 'value', header: 'Value', align: 'right', render: (row) => formatMoney(row.totalCost, row.currency) },
        { id: 'actions', header: 'Action', align: 'right', render: (row) => <Button size="small" component={RouterLink} to={`/stock-movements/${row.id}`}>Open</Button> },
      ]} rows={movementsQuery.data?.content ?? []} getRowId={(row) => row.id} size="small" minWidth={900} emptyTitle="No stock movements" emptyDescription="No stock movements have been recorded for this inventory record yet." pagination={movementPage.pagination(movementsQuery.data, movementsQuery.isFetching)} />
    </RelatedDataSection> : null}
    {isOverlord && activeTab === 'activity' ? <ChangeHistoryPanel entityName="WAREHOUSE_INVENTORY" entityId={record.warehouseId} search={`warehouseId=${record.warehouseId}, productId=${record.productId}`} title="Inventory activity" description="Audit trail for this warehouse/product inventory row." /> : null}
  </EntityDetailsLayout>;
}
