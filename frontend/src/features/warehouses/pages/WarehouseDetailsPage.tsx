import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import DataTable from '../../../shared/components/DataTable/DataTable';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import useDetailsPagination from '../../../shared/hooks/useDetailsPagination';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import { DetailsMetadataCard, DetailsOverviewCard, DetailsStatisticsCard, EntityDetailsLayout, OperationalDetailsTabPanels, RelatedDataSection, buildOperationalTabs } from '../../../shared/components/EntityDetails';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { useCreateEmployeeWarehouseAssignment, useDeleteEmployeeWarehouseAssignment, useEmployeeWarehouseAssignmentsByWarehouse, useUpdateEmployeeWarehouseAssignment } from '../../employee-warehouse-assignments/hooks/useEmployeeWarehouseAssignments';
import type { EmployeeWarehouseAccessType, EmployeeWarehouseAssignmentResponse } from '../../employee-warehouse-assignments/types/employeeWarehouseAssignment.types';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateWarehouseState } from '../../../core/utils/invalidateAppState';
import { parsePositiveIntegerId } from '../../../core/utils/routeParams';
import { warehousesApi } from '../api/warehousesApi';
import { useWarehouse } from '../hooks/useWarehouse';
import type { WarehouseResponse, WarehouseStatus } from '../types/warehouse.types';
import { useInventory } from '../../inventory/hooks/useInventory';
import type { InventoryListRow } from '../../inventory/types/inventory.types';
import { useStockMovements } from '../../stock-movements/hooks/useStockMovements';
import StockMovementsTable from '../../stock-movements/components/StockMovementsTable';
import type { StockMovementFiltersState } from '../../stock-movements/types/stockMovement.types';

type WarehouseDetailsTab = 'overview' | 'inventory' | 'stockMovements' | 'access' | 'attachments' | 'comments' | 'audit' | 'history';
const transitions: Partial<Record<WarehouseStatus, WarehouseStatus[]>> = { ACTIVE: ['FULL', 'UNDER_MAINTENANCE', 'INACTIVE'], FULL: ['ACTIVE', 'INACTIVE'], UNDER_MAINTENANCE: ['ACTIVE', 'INACTIVE'], INACTIVE: ['ACTIVE'], ARCHIVED: [] };
const accessTypes: EmployeeWarehouseAccessType[] = ['WORKER', 'DISPATCH', 'VIEW_ONLY'];

function WarehouseInventoryTable({ rows }: { rows: InventoryListRow[] }) {
  const navigate = useNavigate();
  return <DataTable rows={rows} columns={[
    { id: 'product', header: 'Product', render: (row) => <Stack spacing={0.25}><Typography fontWeight={800}>{row.productName}</Typography><Typography variant="caption" color="text.secondary">{row.productSku ?? 'No SKU'}</Typography></Stack> },
    { id: 'quantity', header: 'Quantity', align: 'right', accessor: 'quantity' }, { id: 'reserved', header: 'Reserved', align: 'right', accessor: 'reservedQuantity' }, { id: 'available', header: 'Available', align: 'right', accessor: 'availableQuantity' },
    { id: 'status', header: 'Status', render: (row) => <StatusChip value={row.derivedStatus} /> },
  ]} getRowId={(row) => `${row.warehouseId}-${row.productId}`} size="small" minWidth={720} onRowClick={(row) => navigate(`/inventory/${row.warehouseId}/${row.productId}`)} emptyTitle="No inventory" emptyDescription="This warehouse does not currently have product stock records." />;
}

function AccessCard({ assignment, busy, onToggle, onDelete }: { assignment: EmployeeWarehouseAssignmentResponse; busy: boolean; onToggle: () => void; onDelete: () => void }) {
  const protectedAssignment = assignment.accessType === 'PRIMARY' || assignment.accessType === 'MANAGER' || assignment.derived;
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
    <Stack><Typography fontWeight={800}>{assignment.employeeName ?? `Employee #${assignment.employeeId}`}</Typography><Typography variant="caption" color="text.secondary">{assignment.employeePosition ?? 'No position'} · {assignment.accessType}{assignment.validTo ? ` · until ${assignment.validTo}` : ''}</Typography></Stack>
    <Stack direction="row" spacing={1} alignItems="center"><StatusChip value={assignment.active ? 'ACTIVE' : 'INACTIVE'} /><Button size="small" disabled={busy || protectedAssignment} onClick={onToggle}>{assignment.active ? 'Deactivate' : 'Activate'}</Button><Button size="small" color="error" disabled={busy || protectedAssignment} onClick={onDelete}>Remove</Button></Stack>
  </Stack></Paper>;
}

function WarehouseAccessPanel({ warehouse }: { warehouse: WarehouseResponse }) {
  const [employee, setEmployee] = useState<LookupOption | null>(null);
  const [accessType, setAccessType] = useState<EmployeeWarehouseAccessType>('WORKER');
  const assignments = useEmployeeWarehouseAssignmentsByWarehouse(warehouse.id);
  const create = useCreateEmployeeWarehouseAssignment();
  const update = useUpdateEmployeeWarehouseAssignment();
  const remove = useDeleteEmployeeWarehouseAssignment();
  const busy = create.isPending || update.isPending || remove.isPending;
  return <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 4 }}><SectionCard title="Assign access" description="Grant an employee an additional warehouse access scope."><Stack spacing={2}>
      <EntityLookupField label="Employee" entityType="employees" value={employee} onChange={setEmployee} required searchPlaceholder="Search employees..." />
      <TextField select label="Access type" value={accessType} onChange={(event) => setAccessType(event.target.value as EmployeeWarehouseAccessType)}>{accessTypes.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
      <Button variant="contained" disabled={!employee || busy} onClick={() => employee && create.mutate({ employeeId: employee.id, warehouseId: warehouse.id, accessType, active: true }, { onSuccess: () => setEmployee(null) })}>Assign access</Button>
    </Stack></SectionCard></Grid>
    <Grid size={{ xs: 12, lg: 8 }}><SectionCard title="Current access" description="Employees with access to this warehouse."><Stack spacing={1.5}>
      {assignments.isLoading ? <Typography color="text.secondary">Loading warehouse access...</Typography> : null}
      {assignments.isError ? <Alert severity="error">Unable to load warehouse access.</Alert> : null}
      {!assignments.isLoading && (assignments.data?.length ?? 0) === 0 ? <Typography color="text.secondary">No additional warehouse access is assigned.</Typography> : null}
      {(assignments.data ?? []).map((item) => <AccessCard key={item.id ?? `${item.employeeId}-${item.accessType}`} assignment={item} busy={busy} onToggle={() => item.id != null && update.mutate({ id: item.id, payload: { active: !item.active } })} onDelete={() => item.id != null && remove.mutate(item.id)} />)}
    </Stack></SectionCard></Grid>
  </Grid>;
}

export default function WarehouseDetailsPage() {
  const navigate = useNavigate();
  const id = parsePositiveIntegerId(useParams().id);
  const warehouseId = id ?? -1;
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const role = useAuthStore().user?.role;
  const canManage = role === ROLES.COMPANY_ADMIN || role === ROLES.WAREHOUSE_MANAGER;
  const canManageAccess = role === ROLES.COMPANY_ADMIN;
  const [activeTab, setActiveTab] = useState<WarehouseDetailsTab>('overview');
  const [transitionTarget, setTransitionTarget] = useState<WarehouseStatus | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementType, setMovementType] = useState<StockMovementFiltersState['movementType']>('ALL');
  const debouncedInventorySearch = useDebounce(inventorySearch, 300);
  const debouncedMovementSearch = useDebounce(movementSearch, 300);
  const inventoryPage = useDetailsPagination(10);
  const movementPage = useDetailsPagination(10);
  const warehouseQuery = useWarehouse(id);
  const inventoryQuery = useInventory({ search: debouncedInventorySearch, warehouseId: id ?? 'ALL', productId: 'ALL', status: 'ALL', page: inventoryPage.page, size: inventoryPage.size, sort: 'product.name,asc' }, id != null && activeTab === 'inventory');
  const movementQuery = useStockMovements({ search: debouncedMovementSearch, movementType, warehouseId: id ?? 'ALL', productId: 'ALL', transportOrderId: 'ALL', fromDate: '', toDate: '', page: movementPage.page, size: movementPage.size, sort: 'createdAt,desc' }, id != null && activeTab === 'stockMovements');

  const changeStatus = useMutation({ mutationFn: ({ status }: { status: WarehouseStatus }) => warehousesApi.changeStatus(warehouseId, status), onSuccess: async (_, variables) => { showSnackbar({ message: `Warehouse status updated to ${variables.status}.`, severity: 'success' }); await invalidateWarehouseState(queryClient, warehouseId); setTransitionTarget(null); }, onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }) });
  const archive = useMutation({ mutationFn: () => warehousesApi.archive(warehouseId), onSuccess: async () => { showSnackbar({ message: 'Warehouse archived successfully.', severity: 'success' }); await invalidateWarehouseState(queryClient, warehouseId); }, onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }) });
  const restore = useMutation({ mutationFn: () => warehousesApi.restore(warehouseId), onSuccess: async () => { showSnackbar({ message: 'Warehouse restored successfully.', severity: 'success' }); await invalidateWarehouseState(queryClient, warehouseId); }, onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }) });

  if (id == null) return <ErrorState title="Invalid warehouse" description="The requested warehouse could not be found." />;
  if (warehouseQuery.isLoading) return <EntityDetailsLayout overline="Storage" title="Warehouse details" loading loadingText="Loading warehouse details..." actionItems={[{ key: 'back', label: 'Back to list', to: '/warehouses' }]}><></></EntityDetailsLayout>;
  if (warehouseQuery.isError || !warehouseQuery.data) return <ErrorState title="Warehouse could not be loaded" description="The requested warehouse details are not available." onRetry={() => void warehouseQuery.refetch()} />;
  const warehouse = warehouseQuery.data;
  const occupied = warehouse.occupiedCapacity ?? 0;
  const available = warehouse.availableCapacity ?? warehouse.capacity - occupied;
  const operational = { entityType: 'WAREHOUSE' as const, entityName: 'WAREHOUSE', entityId: warehouse.id, allowCreateAttachments: canManage, allowCreateComments: canManage };
  const tabs = [{ value: 'overview', label: 'Overview' }, { value: 'inventory', label: `Inventory${inventoryQuery.data ? ` (${inventoryQuery.data.totalElements})` : ''}` }, { value: 'stockMovements', label: `Stock movements${movementQuery.data ? ` (${movementQuery.data.totalElements})` : ''}` }, ...(canManageAccess ? [{ value: 'access', label: 'Access' }] : []), ...buildOperationalTabs(operational)];

  return <EntityDetailsLayout overline="Storage" title={warehouse.name} description={`${warehouse.address}, ${warehouse.cityName ?? warehouse.city}`} tabs={tabs} activeTab={activeTab} onTabChange={(value) => setActiveTab(value as WarehouseDetailsTab)} actionItems={[
    ...(canManage ? [warehouse.status === 'ARCHIVED' ? { key: 'restore', label: 'Restore', color: 'success' as const, onClick: () => restore.mutate() } : { key: 'archive', label: 'Archive', color: 'warning' as const, onClick: () => archive.mutate() }] : []),
    ...(canManage ? [{ key: 'movement', label: 'Create stock movement', to: '/stock-movements/create' }] : []), { key: 'back', label: 'Back to list', to: '/warehouses' },
  ]}>
    {warehouse.status === 'ARCHIVED' ? <ArchivedEntityAlert entityLabel="Warehouse" /> : null}
    {activeTab === 'overview' ? <Stack spacing={3}>
      <DetailsStatisticsCard title="Capacity" statistics={[{ key: 'total', title: 'Total', value: warehouse.capacity }, { key: 'occupied', title: 'Occupied', value: occupied }, { key: 'available', title: 'Available', value: available }]} />
      <DetailsOverviewCard title="Warehouse overview" fields={[
        { label: 'Status', value: <StatusChip value={warehouse.status} /> }, { label: 'City', value: warehouse.cityName ?? warehouse.city }, { label: 'Postal code', value: warehouse.postalCode },
        { label: 'Country', value: warehouse.countryName ?? warehouse.countryCode }, { label: 'Timezone', value: warehouse.timezoneDisplayName ?? warehouse.timezoneName ?? warehouse.timezone },
        { label: 'Coordinates', value: warehouse.latitude != null && warehouse.longitude != null ? `${warehouse.latitude}, ${warehouse.longitude}` : null },
      ]} />
      <DetailsMetadataCard title="Assignment" fields={[{ label: 'Manager', value: warehouse.employeeId ? <Button component={RouterLink} to={`/employees/${warehouse.employeeId}`} size="small">{warehouse.managerName ?? `Employee #${warehouse.employeeId}`}</Button> : null }, { label: 'Warehouse ID', value: warehouse.id }]} />
      {canManage && warehouse.status !== 'ARCHIVED' ? <SectionCard title="Status actions"><Stack direction="row" spacing={1}>{(transitions[warehouse.status] ?? []).map((status) => <Button key={status} variant="outlined" onClick={() => setTransitionTarget(status)}>Mark {status.replaceAll('_', ' ').toLowerCase()}</Button>)}</Stack></SectionCard> : null}
    </Stack> : null}
    {activeTab === 'inventory' ? <RelatedDataSection title="Warehouse inventory" description="Warehouse-level product quantities and availability." loading={inventoryQuery.isLoading} error={inventoryQuery.isError} onRetry={() => void inventoryQuery.refetch()} empty={!inventoryQuery.isLoading && (inventoryQuery.data?.content.length ?? 0) === 0} emptyTitle="No inventory" emptyDescription="This warehouse has no inventory records."><Stack spacing={2}><TextField size="small" label="Search inventory" value={inventorySearch} onChange={(event) => { setInventorySearch(event.target.value); inventoryPage.setPage(0); }} /><WarehouseInventoryTable rows={inventoryQuery.data?.content ?? []} />{inventoryPage.pagination(inventoryQuery.data, inventoryQuery.isFetching)}</Stack></RelatedDataSection> : null}
    {activeTab === 'stockMovements' ? <RelatedDataSection title="Warehouse stock movements" description="Stock movement history for this warehouse." loading={movementQuery.isLoading} error={movementQuery.isError} onRetry={() => void movementQuery.refetch()} empty={!movementQuery.isLoading && (movementQuery.data?.content.length ?? 0) === 0} emptyTitle="No stock movements" emptyDescription="No stock movements have been recorded for this warehouse."><Stack spacing={2}><Grid container spacing={2}><Grid size={{ xs: 12, md: 8 }}><TextField fullWidth size="small" label="Search movements" value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); movementPage.setPage(0); }} /></Grid><Grid size={{ xs: 12, md: 4 }}><TextField fullWidth select size="small" label="Movement type" value={movementType} onChange={(event) => { setMovementType(event.target.value as StockMovementFiltersState['movementType']); movementPage.setPage(0); }}><MenuItem value="ALL">All movement types</MenuItem><MenuItem value="INBOUND">Inbound</MenuItem><MenuItem value="OUTBOUND">Outbound</MenuItem><MenuItem value="TRANSFER_IN">Transfer in</MenuItem><MenuItem value="TRANSFER_OUT">Transfer out</MenuItem><MenuItem value="ADJUSTMENT">Adjustment</MenuItem><MenuItem value="WRITE_OFF">Write off</MenuItem><MenuItem value="RETURN_IN">Return in</MenuItem><MenuItem value="RETURN_OUT">Return out</MenuItem></TextField></Grid></Grid><StockMovementsTable rows={movementQuery.data?.content ?? []} loading={movementQuery.isLoading} error={movementQuery.isError} onRetry={() => void movementQuery.refetch()} pagination={movementPage.pagination(movementQuery.data, movementQuery.isFetching)} /></Stack></RelatedDataSection> : null}
    {activeTab === 'access' && canManageAccess ? <WarehouseAccessPanel warehouse={warehouse} /> : null}
    <OperationalDetailsTabPanels activeTab={activeTab} {...operational} />
    <Dialog open={transitionTarget != null} onClose={() => setTransitionTarget(null)}><DialogTitle>Change warehouse status</DialogTitle><DialogContent><Typography sx={{ mt: 1 }}>Change status from {warehouse.status} to {transitionTarget}.</Typography></DialogContent><DialogActions><Button onClick={() => setTransitionTarget(null)}>Cancel</Button><Button variant="contained" disabled={!transitionTarget || changeStatus.isPending} onClick={() => transitionTarget && changeStatus.mutate({ status: transitionTarget })}>Change status</Button></DialogActions></Dialog>
  </EntityDetailsLayout>;
}
