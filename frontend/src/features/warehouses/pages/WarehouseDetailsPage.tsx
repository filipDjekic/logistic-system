import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  Table,
  TablePagination,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import ArchivedEntityAlert from '../../../shared/components/archive/ArchivedEntityAlert';
import { LifecycleTransitionDialog } from '../../../shared/components/Lifecycle';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import {
  useCreateEmployeeWarehouseAssignment,
  useDeleteEmployeeWarehouseAssignment,
  useEmployeeWarehouseAssignmentsByWarehouse,
  useUpdateEmployeeWarehouseAssignment,
} from '../../employee-warehouse-assignments/hooks/useEmployeeWarehouseAssignments';
import type {
  EmployeeWarehouseAccessType,
  EmployeeWarehouseAssignmentResponse,
} from '../../employee-warehouse-assignments/types/employeeWarehouseAssignment.types';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateWarehouseState } from '../../../core/utils/invalidateAppState';
import { warehouseLocationsApi } from '../../warehouse-locations/api/warehouseLocationsApi';
import { useBinLocations, useWarehouseZones } from '../../warehouse-locations/hooks/useWarehouseLocations';
import { warehousesApi } from '../api/warehousesApi';
import { useWarehouse } from '../hooks/useWarehouse';
import type { BinLocationResponse, WarehouseZoneResponse, WarehouseZoneType } from '../../warehouse-locations/types/warehouseLocation.types';
import type { WarehouseStatus } from '../types/warehouse.types';
import { useInventory } from '../../inventory/hooks/useInventory';
import type { InventoryListRow } from '../../inventory/types/inventory.types';
import { useStockMovements } from '../../stock-movements/hooks/useStockMovements';
import type { StockMovementResponse } from '../../stock-movements/types/stockMovement.types';
import { warehouseLocationRoutes } from '../../warehouse-locations/utils/warehouseLocationRoutes';

type WarehouseDetailsTab =
  | 'overview'
  | 'locations'
  | 'bins'
  | 'inventory'
  | 'stockMovements'
  | 'access'
  | 'commentsAttachments'
  | 'eventsHistory';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}


function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: string) {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}


const zoneTypes: WarehouseZoneType[] = ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'DISPATCH', 'RETURNS', 'QUARANTINE', 'OTHER'];

function CreateWarehouseLocationDialog({
  open,
  warehouseId,
  warehouseName,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  warehouseId: number;
  warehouseName: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { warehouseId: number; code: string; name: string; type: WarehouseZoneType; capacity?: number | null; description?: string | null }) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<WarehouseZoneType>('STORAGE');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  const resetAndClose = () => {
    if (loading) return;
    setCode('');
    setName('');
    setType('STORAGE');
    setCapacity('');
    setDescription('');
    onClose();
  };

  const submitDisabled = code.trim().length === 0 || name.trim().length === 0;

  return (
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm">
      <DialogTitle>Create warehouse location</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Warehouse" value={warehouseName} fullWidth disabled />
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} required fullWidth />
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <TextField select label="Type" value={type} onChange={(event) => setType(event.target.value as WarehouseZoneType)} fullWidth>
            {zoneTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </TextField>
          <TextField label="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" fullWidth />
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={resetAndClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={submitDisabled || loading}
          onClick={() => {
            onSubmit({
              warehouseId,
              code: code.trim(),
              name: name.trim(),
              type,
              capacity: toNullableNumber(capacity),
              description: description.trim() || null,
            });
            setCode('');
            setName('');
            setType('STORAGE');
            setCapacity('');
            setDescription('');
          }}
        >
          {loading ? 'Creating...' : 'Create location'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function QuantityBar({ value, total }: { value: number | string | null | undefined; total: number }) {
  const numeric = toNumber(value);
  const percent = total > 0 ? Math.min(100, Math.max(0, (numeric / total) * 100)) : 0;
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" fontWeight={800} align="right">{numeric}</Typography>
      <LinearProgress variant="determinate" value={percent} />
    </Stack>
  );
}

function usePagedState(defaultSize = 10) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);
  const pagination = (data: { totalElements: number; number: number; size: number } | undefined) => (
    <TablePagination
      component="div"
      count={data?.totalElements ?? 0}
      page={data?.number ?? page}
      rowsPerPage={data?.size ?? size}
      rowsPerPageOptions={[5, 10, 20, 50]}
      onPageChange={(_, nextPage) => setPage(nextPage)}
      onRowsPerPageChange={(event) => {
        setPage(0);
        setSize(Number(event.target.value));
      }}
    />
  );

  return { page, size, setPage, pagination };
}

function ZonesTable({ rows, onOpenZone }: { rows: WarehouseZoneResponse[]; onOpenZone: (zone: WarehouseZoneResponse) => void }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Capacity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => onOpenZone(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>
                <Typography fontWeight={800}>{row.code}</Typography>
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>
                <Chip size="small" variant="outlined" label={row.type} />
              </TableCell>
              <TableCell align="right">{row.capacity ?? '—'}</TableCell>
              <TableCell>
                <StatusChip value={row.active ? 'ACTIVE' : 'INACTIVE'} />
              </TableCell>
              <TableCell>{formatDate(row.updatedAt ?? row.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


function WarehouseBinsTable({ rows, onOpenBin }: { rows: BinLocationResponse[]; onOpenBin: (bin: BinLocationResponse) => void }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Bin</TableCell>
            <TableCell>Location / zone</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Capacity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => onOpenBin(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>
                <Typography fontWeight={800}>{row.code}</Typography>
                <Typography variant="caption" color="text.secondary">{row.name}</Typography>
              </TableCell>
              <TableCell>
                <Button size="small" component={RouterLink} to={warehouseLocationRoutes.warehouseLocationDetails(row.warehouseId, row.zoneId)} onClick={(event) => event.stopPropagation()} sx={{ px: 0, minWidth: 0 }}>
                  {row.zoneCode} · {row.zoneName}
                </Button>
              </TableCell>
              <TableCell><Chip size="small" variant="outlined" label={row.zoneType} /></TableCell>
              <TableCell align="right">{row.capacity ?? '—'}</TableCell>
              <TableCell><StatusChip value={row.active ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
              <TableCell>{formatDate(row.updatedAt ?? row.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function WarehouseInventoryTable({ rows, onOpenInventory }: { rows: InventoryListRow[]; onOpenInventory: (row: InventoryListRow) => void }) {
  const totalQuantity = rows.reduce((sum, row) => sum + toNumber(row.quantity), 0);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Reserved</TableCell>
            <TableCell align="right">Available</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.warehouseId}-${row.productId}`} hover onClick={() => onOpenInventory(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>
                <Typography fontWeight={800}>{row.productName}</Typography>
                <Typography variant="caption" color="text.secondary">Product #{row.productId}</Typography>
              </TableCell>
              <TableCell>{row.productSku ?? '—'}</TableCell>
              <TableCell align="right" sx={{ minWidth: 180 }}>
                <QuantityBar value={row.quantity} total={totalQuantity} />
              </TableCell>
              <TableCell align="right">{row.reservedQuantity}</TableCell>
              <TableCell align="right">{row.availableQuantity}</TableCell>
              <TableCell><StatusChip value={row.derivedStatus} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function StockMovementsTable({ rows, onOpenMovement }: { rows: StockMovementResponse[]; onOpenMovement: (row: StockMovementResponse) => void }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Bins</TableCell>
            <TableCell>Transport</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => onOpenMovement(row)} sx={{ cursor: 'pointer' }}>
              <TableCell>#{row.id}</TableCell>
              <TableCell><Chip size="small" variant="outlined" label={row.movementType} /></TableCell>
              <TableCell>
                <Button size="small" component={RouterLink} to={warehouseLocationRoutes.productDetails(row.productId)} onClick={(event) => event.stopPropagation()} sx={{ px: 0, minWidth: 0 }}>
                  {row.productName}
                </Button>
              </TableCell>
              <TableCell>
                <Stack spacing={0.25} alignItems="flex-start">
                  {row.sourceBinId && row.sourceBinZoneId ? (
                    <Button size="small" component={RouterLink} to={warehouseLocationRoutes.binDetails(row.warehouseId, row.sourceBinZoneId, row.sourceBinId)} onClick={(event) => event.stopPropagation()} sx={{ px: 0, minWidth: 0 }}>
                      Source: {row.sourceBinCode ?? `#${row.sourceBinId}`}
                    </Button>
                  ) : <Typography variant="caption" color="text.secondary">Source: —</Typography>}
                  {row.destinationBinId && row.destinationBinZoneId ? (
                    <Button size="small" component={RouterLink} to={warehouseLocationRoutes.binDetails(row.warehouseId, row.destinationBinZoneId, row.destinationBinId)} onClick={(event) => event.stopPropagation()} sx={{ px: 0, minWidth: 0 }}>
                      Destination: {row.destinationBinCode ?? `#${row.destinationBinId}`}
                    </Button>
                  ) : <Typography variant="caption" color="text.secondary">Destination: —</Typography>}
                </Stack>
              </TableCell>
              <TableCell>
                {row.transportOrderId ? (
                  <Button size="small" component={RouterLink} to={warehouseLocationRoutes.transportOrderDetails(row.transportOrderId)} onClick={(event) => event.stopPropagation()} sx={{ px: 0, minWidth: 0 }}>
                    #{row.transportOrderId}
                  </Button>
                ) : '—'}
              </TableCell>
              <TableCell align="right">{row.quantity}</TableCell>
              <TableCell>{row.reasonCode ?? '—'}</TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const warehouseAccessTypes: EmployeeWarehouseAccessType[] = ['PRIMARY', 'WORKER', 'MANAGER', 'DISPATCH', 'VIEW_ONLY'];

const accessTypeDescriptions: Record<EmployeeWarehouseAccessType, string> = {
  PRIMARY: 'Primary warehouse responsibility. Usually one main operational owner for the employee.',
  WORKER: 'Can work inside the warehouse scope and receive warehouse tasks.',
  MANAGER: 'Can manage warehouse work, access, inventory visibility and scoped operations.',
  DISPATCH: 'Can coordinate dispatch-related warehouse work and movement preparation.',
  VIEW_ONLY: 'Can inspect warehouse data without operational changes.',
};

type WarehouseAccessFormState = {
  employee: LookupOption | null;
  accessType: EmployeeWarehouseAccessType;
  validFrom: string;
  validTo: string;
  active: boolean;
  notes: string;
};

const initialWarehouseAccessForm: WarehouseAccessFormState = {
  employee: null,
  accessType: 'WORKER',
  validFrom: '',
  validTo: '',
  active: true,
  notes: '',
};

function WarehouseAccessCard({
  assignment,
  onToggle,
  onDelete,
  disabled,
}: {
  assignment: EmployeeWarehouseAssignmentResponse;
  onToggle: (assignment: EmployeeWarehouseAssignmentResponse) => void;
  onDelete: (assignment: EmployeeWarehouseAssignmentResponse) => void;
  disabled: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack spacing={0.5}>
            <Typography fontWeight={900}>{assignment.employeeName ?? `Employee #${assignment.employeeId}`}</Typography>
            <Typography variant="caption" color="text.secondary">
              {assignment.employeePosition ?? 'No position'} · {assignment.companyName ?? 'Company scope'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Chip size="small" label={assignment.accessType} color={assignment.active ? 'primary' : 'default'} />
            <StatusChip value={assignment.active ? 'ACTIVE' : 'INACTIVE'} />
            <Button size="small" variant="outlined" disabled={disabled} onClick={() => onToggle(assignment)}>
              {assignment.active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button size="small" color="error" disabled={disabled} onClick={() => onDelete(assignment)}>
              Remove
            </Button>
          </Stack>
        </Stack>
        <Divider />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Permission scope" value={accessTypeDescriptions[assignment.accessType]} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Validity" value={`${assignment.validFrom ?? 'Immediately'} → ${assignment.validTo ?? 'No end date'}`} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Explanation" value={assignment.notes ?? '—'} />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}

function WarehouseAccessPanel({ warehouseId, warehouseName }: { warehouseId: number; warehouseName: string }) {
  const [form, setForm] = useState<WarehouseAccessFormState>(initialWarehouseAccessForm);
  const assignmentsQuery = useEmployeeWarehouseAssignmentsByWarehouse(warehouseId);
  const createMutation = useCreateEmployeeWarehouseAssignment();
  const updateMutation = useUpdateEmployeeWarehouseAssignment();
  const deleteMutation = useDeleteEmployeeWarehouseAssignment();

  const assignments = assignmentsQuery.data ?? [];
  const canSubmit = Boolean(form.employee?.id && form.accessType);
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Stack spacing={3}>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionCard title="Assign access" description="Structured warehouse access form with employee lookup, permission scope and validity window.">
            <Stack spacing={2.25}>
              <Box>
                <EntityLookupField
                  label="Employee"
                  entityType="employees"
                  value={form.employee}
                  onChange={(option) => setForm((current) => ({ ...current, employee: option }))}
                  required
                  placeholder="Choose employee"
                  searchPlaceholder="Search employees by name, email or position..."
                  sort="lastName,asc"
                />
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">Role</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  {warehouseAccessTypes.map((type) => (
                    <Chip
                      key={type}
                      label={type}
                      color={form.accessType === type ? 'primary' : 'default'}
                      variant={form.accessType === type ? 'filled' : 'outlined'}
                      onClick={() => setForm((current) => ({ ...current, accessType: type }))}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">Permission scope</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" fontWeight={800}>{form.accessType}</Typography>
                  <Typography variant="body2" color="text.secondary">{accessTypeDescriptions[form.accessType]}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Preview: {form.employee?.label ?? 'Selected employee'} gets {form.accessType.toLowerCase().replaceAll('_', ' ')} access for {warehouseName}.
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Valid from"
                      type="date"
                      value={form.validFrom}
                      onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Valid until"
                      type="date"
                      value={form.validTo}
                      onChange={(event) => setForm((current) => ({ ...current, validTo: event.target.value }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <TextField
                  select
                  label="Status"
                  value={form.active ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'ACTIVE' }))}
                  fullWidth
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </TextField>
              </Box>

              <TextField
                label="Explanation text"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                fullWidth
                multiline
                minRows={3}
                placeholder="Explain why this employee needs warehouse access..."
              />

              <Button
                variant="contained"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() => {
                  if (!form.employee?.id) return;
                  createMutation.mutate({
                    employeeId: form.employee.id,
                    warehouseId,
                    accessType: form.accessType,
                    validFrom: form.validFrom || null,
                    validTo: form.validTo || null,
                    active: form.active,
                    notes: form.notes || null,
                  }, {
                    onSuccess: () => setForm(initialWarehouseAccessForm),
                  });
                }}
              >
                Assign access
              </Button>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard title="Current access" description="Employees and permission scopes currently assigned to this warehouse.">
            <Stack spacing={1.5}>
              {assignmentsQuery.isLoading ? <Typography color="text.secondary">Loading warehouse access...</Typography> : null}
              {assignmentsQuery.isError ? <Alert severity="error">Unable to load warehouse access.</Alert> : null}
              {!assignmentsQuery.isLoading && !assignmentsQuery.isError && assignments.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">No employee has warehouse access assigned for this warehouse.</Typography>
                </Paper>
              ) : null}
              {assignments.map((assignment) => (
                <WarehouseAccessCard
                  key={assignment.id}
                  assignment={assignment}
                  disabled={busy}
                  onToggle={(current) => updateMutation.mutate({ id: current.id, payload: { active: !current.active } })}
                  onDelete={(current) => deleteMutation.mutate(current.id)}
                />
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}


export default function WarehouseDetailsPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const warehouseId = Number(params.id);
  const validWarehouseId = Number.isFinite(warehouseId) ? warehouseId : null;
  const scopedWarehouseId = validWarehouseId ?? -1;

  const [activeTab, setActiveTab] = useState<WarehouseDetailsTab>('overview');
  const zonePage = usePagedState();
  const binPage = usePagedState();
  const inventoryPage = usePagedState();
  const stockMovementPage = usePagedState();
  const [zoneSearch, setZoneSearch] = useState('');
  const [binSearch, setBinSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  const canManage =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const canManageStorage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const [createLocationOpen, setCreateLocationOpen] = useState(false);

  const canManageAccess =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const canViewInventoryTab = auth.user?.role !== ROLES.WORKER;

  const warehouseQuery = useWarehouse(validWarehouseId);
  const warehouse = warehouseQuery.data;

  const zoneQuery = useWarehouseZones({ warehouseId: scopedWarehouseId, search: zoneSearch.trim() || undefined, page: zonePage.page, size: zonePage.size, sort: 'code,asc' }, Boolean(validWarehouseId) && activeTab === 'locations');
  const binQuery = useBinLocations({ warehouseId: scopedWarehouseId, search: binSearch.trim() || undefined, page: binPage.page, size: binPage.size, sort: 'code,asc' }, Boolean(validWarehouseId) && activeTab === 'bins');
  const inventoryQuery = useInventory(
    { search: inventorySearch, warehouseId: scopedWarehouseId ?? 'ALL', productId: 'ALL', status: 'ALL', page: inventoryPage.page, size: inventoryPage.size, sort: 'product.name,asc' },
    { warehouses: [], products: [] },
    Boolean(validWarehouseId) && canViewInventoryTab && activeTab === 'inventory',
  );
  const stockMovementQuery = useStockMovements({ search: movementSearch, movementType: movementTypeFilter as any, warehouseId: scopedWarehouseId ?? 'ALL', productId: 'ALL', transportOrderId: 'ALL', fromDate: '', toDate: '', page: stockMovementPage.page, size: stockMovementPage.size, sort: 'createdAt,desc' }, Boolean(validWarehouseId) && activeTab === 'stockMovements');

  const zones = zoneQuery.data?.content ?? [];
  const bins = binQuery.data?.content ?? [];
  const inventory = activeTab === 'inventory' ? inventoryQuery.data?.content ?? [] : [];
  const stockMovements = stockMovementQuery.data?.content ?? [];

  const [transitionTarget, setTransitionTarget] = useState<WarehouseStatus | null>(null);

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: WarehouseStatus; reason?: string }) =>
      warehousesApi.changeStatus(id, status),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Warehouse status updated to ${variables.status}.`,
        severity: 'success',
      });

      await invalidateWarehouseState(queryClient, variables.id);

      setTransitionTarget(null);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });


  const archiveMutation = useMutation({
    mutationFn: (id: number) => warehousesApi.archive(id),
    onSuccess: async (updated) => {
      showSnackbar({ message: 'Warehouse archived successfully.', severity: 'success' });
      await invalidateWarehouseState(queryClient, updated.id);
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => warehousesApi.restore(id),
    onSuccess: async (updated) => {
      showSnackbar({ message: 'Warehouse restored successfully.', severity: 'success' });
      await invalidateWarehouseState(queryClient, updated.id);
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: warehouseLocationsApi.createZone,
    onSuccess: async () => {
      showSnackbar({ message: 'Warehouse location created successfully.', severity: 'success' });
      setCreateLocationOpen(false);
      setActiveTab('locations');
      await queryClient.invalidateQueries({ queryKey: ['warehouse-locations', 'zones'] });
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });

  if (!Number.isFinite(warehouseId)) {
    return (
      <ErrorState
        title="Invalid warehouse"
        description="The warehouse ID in the route is not valid."
      />
    );
  }

  if (warehouseQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Storage"
        title="Warehouse details"
        actions={
          <Button variant="outlined" onClick={() => navigate(warehouseLocationRoutes.warehouses())}>
            Back to list
          </Button>
        }
      >
        <SectionCard>
          <Typography color="text.secondary">Loading warehouse details...</Typography>
        </SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (warehouseQuery.isError || !warehouse) {
    return (
      <ErrorState
        title="Warehouse could not be loaded"
        description="The requested warehouse details are not available."
        onRetry={() => void warehouseQuery.refetch()}
      />
    );
  }

  const tabItems: { value: WarehouseDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'locations', label: `Locations${zoneQuery.data ? ` (${zoneQuery.data.totalElements})` : ''}` },
    ...(canViewInventoryTab ? [{ value: 'inventory' as WarehouseDetailsTab, label: `Inventory${inventoryQuery.data ? ` (${inventoryQuery.data.totalElements})` : ''}` }] : []),
    { value: 'stockMovements', label: `Movements${stockMovementQuery.data ? ` (${stockMovementQuery.data.totalElements})` : ''}` },
    ...(canManageAccess ? [{ value: 'access' as WarehouseDetailsTab, label: 'Access' }] : []),
    { value: 'commentsAttachments', label: 'Attachments & comments' },
    { value: 'eventsHistory', label: 'Events & history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Storage"
      title={warehouse.name}
      description={`Warehouse #${warehouse.id} • ${warehouse.city}`}
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as WarehouseDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {canManage && warehouse.active ? (
            <Button variant="outlined" color="warning" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(warehouse.id)}>Archive</Button>
          ) : null}
          {canManage && !warehouse.active ? (
            <Button variant="contained" color="success" disabled={restoreMutation.isPending} onClick={() => restoreMutation.mutate(warehouse.id)}>Restore</Button>
          ) : null}
          {canManage ? (
            <Button
              variant="outlined"
              onClick={() => navigate('/stock-movements/create')}
            >
              Create stock movement
            </Button>
          ) : null}
          <Button variant="outlined" onClick={() => navigate(warehouseLocationRoutes.warehouses())}>
            Back to list
          </Button>
        </Stack>
      }
    >
      {!warehouse.active ? <ArchivedEntityAlert entityLabel="Warehouse" /> : null}

      {activeTab === 'overview' ? (
        <Stack spacing={3}>
          <SectionCard title="Warehouse overview">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="Name" value={warehouse.name} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="City" value={warehouse.city} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="Address" value={warehouse.address} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="Capacity" value={warehouse.capacity} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Stack alignItems="flex-start">
                    <StatusChip value={warehouse.status} />
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Active
                  </Typography>
                  <Stack alignItems="flex-start">
                    <StatusChip value={warehouse.active ? 'ACTIVE' : 'INACTIVE'} />
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Bin tracking</Typography>
                  <Chip size="small" color={warehouse.binTrackingEnabled ? 'success' : 'default'} label={warehouse.binTrackingEnabled ? 'ENABLED' : 'WAREHOUSE ONLY'} sx={{ alignSelf: 'flex-start' }} />
                </Stack>
              </Grid>
            </Grid>
          </SectionCard>


          <SectionCard title="Ownership and assignment">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="Manager employee" value={warehouse.employeeId ? <Button component={RouterLink} to={`/employees/${warehouse.employeeId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{warehouse.managerName ?? `Employee #${warehouse.employeeId}`}</Button> : '—'} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="Manager name" value={warehouse.managerName ?? '—'} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <InfoRow label="Company" value={warehouse.companyName ?? '—'} />
              </Grid>
            </Grid>
          </SectionCard>
        </Stack>
      ) : null}

      {activeTab === 'locations' ? (
        <RelatedDataSection
          title="Locations"
          description="Warehouse physical layout starts here: open a location/zone, then drill down into its bins and bin inventory."
          action={canManageStorage ? (
            <Button variant="outlined" onClick={() => setCreateLocationOpen(true)}>
              Create location
            </Button>
          ) : undefined}
          loading={zoneQuery.isLoading}
          error={zoneQuery.isError}
          onRetry={() => void zoneQuery.refetch()}
          empty={!zoneQuery.isLoading && !zoneQuery.isError && zones.length === 0}
          emptyTitle="No bin locations"
          emptyDescription="This warehouse does not have configured locations/zones yet. Create locations before managing bins and bin inventory."
        >
          <Stack spacing={2}>
            <TextField
              size="small"
              label="Search locations"
              value={zoneSearch}
              onChange={(event) => { setZoneSearch(event.target.value); zonePage.setPage(0) }}
              placeholder="Search by code, name or type"
              fullWidth
            />
            <ZonesTable rows={zones} onOpenZone={(zone) => navigate(warehouseLocationRoutes.warehouseLocationDetails(warehouse.id, zone.id))} />
          </Stack>
          {zonePage.pagination(zoneQuery.data)}
        </RelatedDataSection>
      ) : null}


      {activeTab === 'bins' ? (
        <RelatedDataSection
          title="Bins"
          description="All bin locations for this warehouse. Open a bin to see its details, bin inventory, stock movements and movement trace."
          action={
            <Button variant="outlined" onClick={() => setActiveTab('locations')}>
              Open locations
            </Button>
          }
          loading={binQuery.isLoading}
          error={binQuery.isError}
          onRetry={() => void binQuery.refetch()}
          empty={!binQuery.isLoading && !binQuery.isError && bins.length === 0}
          emptyTitle="No bins"
          emptyDescription="This warehouse does not have configured bins yet. Create bins inside a warehouse location first."
        >
          <Stack spacing={2}>
            <TextField
              size="small"
              label="Search bins"
              value={binSearch}
              onChange={(event) => { setBinSearch(event.target.value); binPage.setPage(0); }}
              placeholder="Search by bin code, label or location"
              fullWidth
            />
            <WarehouseBinsTable rows={bins} onOpenBin={(bin) => navigate(warehouseLocationRoutes.binDetails(warehouse.id, bin.zoneId, bin.id))} />
          </Stack>
          {binPage.pagination(binQuery.data)}
        </RelatedDataSection>
      ) : null}

      {activeTab === 'inventory' ? (
        <RelatedDataSection
          title="Warehouse inventory"
          description="Warehouse-level product stock. Physical bin distribution is opened from zone and bin details."
          loading={inventoryQuery.isLoading}
          error={inventoryQuery.isError}
          onRetry={() => void inventoryQuery.refetch()}
          empty={!inventoryQuery.isLoading && !inventoryQuery.isError && inventory.length === 0}
          emptyTitle="No inventory"
          emptyDescription="This warehouse does not currently have product stock records."
        >
          <Stack spacing={2}>
            <TextField
              size="small"
              label="Search inventory"
              value={inventorySearch}
              onChange={(event) => { setInventorySearch(event.target.value); inventoryPage.setPage(0); }}
              placeholder="Search by product, SKU or status"
              fullWidth
            />
            <WarehouseInventoryTable rows={inventory} onOpenInventory={(row) => navigate(warehouseLocationRoutes.inventoryDetails(row.warehouseId, row.productId))} />
          </Stack>
          {inventoryPage.pagination(inventoryQuery.data)}
        </RelatedDataSection>
      ) : null}

      {activeTab === 'stockMovements' ? (
        <Stack spacing={3}>
          <RelatedDataSection
            title="Warehouse stock movements"
            description="Inbound, outbound, transfer, adjustment, write-off, return and reservation records scoped to this warehouse."
            loading={stockMovementQuery.isLoading}
            error={stockMovementQuery.isError}
            onRetry={() => void stockMovementQuery.refetch()}
            empty={!stockMovementQuery.isLoading && !stockMovementQuery.isError && stockMovements.length === 0}
            emptyTitle="No stock movements"
            emptyDescription="No stock movements have been recorded for this warehouse yet."
          >
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    size="small"
                    label="Search movements"
                    value={movementSearch}
                    onChange={(event) => { setMovementSearch(event.target.value); stockMovementPage.setPage(0); }}
                    placeholder="Search by product, reason, reference or movement id"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    size="small"
                    label="Movement type"
                    value={movementTypeFilter}
                    onChange={(event) => { setMovementTypeFilter(event.target.value); stockMovementPage.setPage(0); }}
                    fullWidth
                  >
                    <MenuItem value="ALL">All movement types</MenuItem>
                    <MenuItem value="INBOUND">Inbound</MenuItem>
                    <MenuItem value="OUTBOUND">Outbound</MenuItem>
                    <MenuItem value="TRANSFER_IN">Transfer in</MenuItem>
                    <MenuItem value="TRANSFER_OUT">Transfer out</MenuItem>
                    <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
                    <MenuItem value="WRITE_OFF">Write off</MenuItem>
                    <MenuItem value="RETURN_IN">Return in</MenuItem>
                    <MenuItem value="RETURN_OUT">Return out</MenuItem>
                    <MenuItem value="RESERVATION">Reservation</MenuItem>
                    <MenuItem value="RESERVATION_RELEASE">Reservation release</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <StockMovementsTable rows={stockMovements} onOpenMovement={(movement) => navigate(warehouseLocationRoutes.stockMovementDetails(movement.id))} />
            </Stack>
            {stockMovementPage.pagination(stockMovementQuery.data)}
          </RelatedDataSection>
        </Stack>
      ) : null}

      {activeTab === 'access' && canManageAccess ? (
        <WarehouseAccessPanel warehouseId={warehouse.id} warehouseName={warehouse.name} />
      ) : null}

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <CommentsPanel entityType="WAREHOUSE" entityId={warehouse.id} allowCreate={canManageStorage} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AttachmentsPanel entityType="WAREHOUSE" entityId={warehouse.id} allowCreate={canManageStorage} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'eventsHistory' ? (
        <Stack spacing={3}>
          <DomainEventsPanel entityType="WAREHOUSE" entityId={warehouse.id} />
          <Stack spacing={2}>
            <ChangeHistoryPanel entityName="WAREHOUSE" entityId={warehouse.id} />
            <Stack alignItems="flex-end">
              <Link component="button" variant="body2" onClick={() => navigate(`/change-history?entityName=WAREHOUSE&entityId=${warehouse.id}`)}>
                Open full change history
              </Link>
            </Stack>
          </Stack>
        </Stack>
      ) : null}

      <CreateWarehouseLocationDialog
        open={createLocationOpen}
        warehouseId={warehouse.id}
        warehouseName={warehouse.name}
        loading={createLocationMutation.isPending}
        onClose={() => setCreateLocationOpen(false)}
        onSubmit={(payload) => createLocationMutation.mutate(payload)}
      />

      <LifecycleTransitionDialog
        open={transitionTarget != null}
        entityLabel="warehouse"
        fromStatus={warehouse.status}
        toStatus={transitionTarget}
        loading={changeStatusMutation.isPending}
        requireReason={transitionTarget === 'INACTIVE' || transitionTarget === 'UNDER_MAINTENANCE'}
        onClose={() => setTransitionTarget(null)}
        onConfirm={(reason) => {
          if (!transitionTarget) return;
          changeStatusMutation.mutate({ id: warehouse.id, status: transitionTarget, reason });
        }}
      />

    </EntityDetailsLayout>
  );
}
