import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import WarehouseStorageFlowGuide from '../components/WarehouseStorageFlowGuide';
import DataTable from '../../../shared/components/DataTable/DataTable';
import FormActions from '../../../shared/components/Form/FormActions';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { buildSortParam } from '../../../core/api/pagination';
import { warehouseLocationsApi } from '../api/warehouseLocationsApi';
import {
  useBinInventory,
  useBinLocations,
  useInternalWarehouseMovements,
  useWarehouseZones,
} from '../hooks/useWarehouseLocations';
import type {
  BinInventoryResponse,
  BinLocationResponse,
  InternalWarehouseMovementResponse,
  WarehouseZoneResponse,
  WarehouseZoneType,
} from '../types/warehouseLocation.types';

type TabKey = 'zones' | 'bins' | 'bin-inventory' | 'internal-movements';

const zoneTypes: WarehouseZoneType[] = ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'DISPATCH', 'RETURNS', 'QUARANTINE', 'OTHER'];
const tabs: { value: TabKey; label: string }[] = [
  { value: 'zones', label: 'Locations / zones' },
  { value: 'bins', label: 'Bins' },
  { value: 'bin-inventory', label: 'Bin inventory' },
  { value: 'internal-movements', label: 'Internal movements' },
];

function toNumber(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toNullableNumber(value: string) {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function usePagedState(defaultSize = 10) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);
  const reset = () => setPage(0);
  const pagination = (data: { totalElements: number; number: number; size: number } | undefined, disabled = false) => (
    <TablePagination
      component="div"
      count={data?.totalElements ?? 0}
      page={data?.number ?? page}
      rowsPerPage={data?.size ?? size}
      rowsPerPageOptions={[5, 10, 20, 50]}
      onPageChange={(_, nextPage) => {
        if (!disabled) setPage(nextPage);
      }}
      onRowsPerPageChange={(event) => {
        if (!disabled) {
          setPage(0);
          setSize(Number(event.target.value));
        }
      }}
    />
  );

  return { page, size, setPage, reset, pagination };
}

function CreateZoneDialog({
  open,
  warehouse,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  warehouse: LookupOption | null;
  onClose: () => void;
  onSubmit: (payload: { warehouseId: number; code: string; name: string; type: WarehouseZoneType; capacity?: number | null; description?: string | null }) => void;
  loading: boolean;
}) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(warehouse);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<WarehouseZoneType>('STORAGE');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create warehouse location / zone</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <EntityLookupField label="Warehouse" entityType="warehouses" value={selectedWarehouse} onChange={setSelectedWarehouse} required />
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} required fullWidth />
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <TextField select label="Type" value={type} onChange={(event) => setType(event.target.value as WarehouseZoneType)} fullWidth>
            {zoneTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </TextField>
          <TextField label="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" fullWidth />
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel="Create"
          submittingLabel="Creating zone..."
          helperText="Warehouse, code and name are required. Capacity is optional."
          loading={loading}
          submitDisabled={!selectedWarehouse || code.trim().length === 0 || name.trim().length === 0}
          onCancel={onClose}
          onSubmit={() => selectedWarehouse && onSubmit({
            warehouseId: selectedWarehouse.id,
            code: code.trim(),
            name: name.trim(),
            type,
            capacity: toNullableNumber(capacity),
            description: description.trim() || null,
          })}
        />
      </DialogContent>
    </Dialog>
  );

}

function EditZoneDialog({
  zone,
  open,
  onClose,
  onSubmit,
  loading,
}: {
  zone: WarehouseZoneResponse | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, payload: { code: string; name: string; type: WarehouseZoneType; capacity?: number | null; active: boolean; description?: string | null }) => void;
  loading: boolean;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<WarehouseZoneType>('STORAGE');
  const [capacity, setCapacity] = useState('');
  const [active, setActive] = useState('true');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!zone) return;
    setCode(zone.code);
    setName(zone.name);
    setType(zone.type);
    setCapacity(zone.capacity == null ? '' : String(zone.capacity));
    setActive(zone.active ? 'true' : 'false');
    setDescription(zone.description ?? '');
  }, [zone]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit warehouse location / zone</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Warehouse" value={zone ? `${zone.warehouseName} (#${zone.warehouseId})` : ''} fullWidth disabled />
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} required fullWidth />
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <TextField select label="Type" value={type} onChange={(event) => setType(event.target.value as WarehouseZoneType)} fullWidth>
            {zoneTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </TextField>
          <TextField label="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" fullWidth />
          <TextField select label="Active" value={active} onChange={(event) => setActive(event.target.value)} fullWidth>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel="Save"
          submittingLabel="Saving zone..."
          helperText="Code, name, type and active status are required. Capacity is optional."
          loading={loading}
          submitDisabled={!zone || code.trim().length === 0 || name.trim().length === 0}
          onCancel={onClose}
          onSubmit={() => zone && onSubmit(zone.id, {
            code: code.trim(),
            name: name.trim(),
            type,
            capacity: toNullableNumber(capacity),
            active: active === 'true',
            description: description.trim() || null,
          })}
        />
      </DialogContent>
    </Dialog>
  );
}

function CreateBinDialog({
  open,
  warehouse,
  selectedZone,
  zones,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  warehouse: LookupOption | null;
  selectedZone: WarehouseZoneResponse | null;
  zones: WarehouseZoneResponse[];
  onClose: () => void;
  onSubmit: (payload: { warehouseId: number; zoneId: number; code: string; name: string; capacity?: number | null; description?: string | null }) => void;
  loading: boolean;
}) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(warehouse);
  const [zoneId, setZoneId] = useState<string>(selectedZone ? String(selectedZone.id) : '');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  const selectedZoneRow = zones.find((zone) => String(zone.id) === zoneId);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create bin</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <EntityLookupField label="Warehouse" entityType="warehouses" value={selectedWarehouse} onChange={setSelectedWarehouse} required />
          <TextField select label="Zone" value={zoneId} onChange={(event) => setZoneId(event.target.value)} fullWidth required>
            {zones.map((zone) => <MenuItem key={zone.id} value={String(zone.id)}>{zone.code} · {zone.name}</MenuItem>)}
          </TextField>
          {!selectedZoneRow ? <Alert severity="info">Select/load a warehouse zone first. Bins must belong to one zone.</Alert> : null}
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} required fullWidth />
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <TextField label="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" fullWidth />
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel="Create"
          submittingLabel="Creating bin..."
          helperText="Warehouse, zone, code and name are required. Capacity is optional."
          loading={loading}
          submitDisabled={!selectedWarehouse || !selectedZoneRow || code.trim().length === 0 || name.trim().length === 0}
          onCancel={onClose}
          onSubmit={() => selectedWarehouse && selectedZoneRow && onSubmit({
            warehouseId: selectedWarehouse.id,
            zoneId: selectedZoneRow.id,
            code: code.trim(),
            name: name.trim(),
            capacity: toNullableNumber(capacity),
            description: description.trim() || null,
          })}
        />
      </DialogContent>
    </Dialog>
  );

}

function EditBinDialog({
  bin,
  zones,
  open,
  onClose,
  onSubmit,
  loading,
}: {
  bin: BinLocationResponse | null;
  zones: WarehouseZoneResponse[];
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, payload: { zoneId: number; code: string; name: string; capacity?: number | null; active: boolean; description?: string | null }) => void;
  loading: boolean;
}) {
  const [zoneId, setZoneId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [active, setActive] = useState('true');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!bin) return;
    setZoneId(String(bin.zoneId));
    setCode(bin.code);
    setName(bin.name);
    setCapacity(bin.capacity == null ? '' : String(bin.capacity));
    setActive(bin.active ? 'true' : 'false');
    setDescription(bin.description ?? '');
  }, [bin]);

  const selectedZoneRow = zones.find((zone) => String(zone.id) === zoneId);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit bin</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Warehouse" value={bin ? `${bin.warehouseName} (#${bin.warehouseId})` : ''} fullWidth disabled />
          <TextField select label="Zone" value={zoneId} onChange={(event) => setZoneId(event.target.value)} fullWidth required>
            {zones.map((zone) => <MenuItem key={zone.id} value={String(zone.id)}>{zone.code} · {zone.name}</MenuItem>)}
          </TextField>
          {!selectedZoneRow ? <Alert severity="warning">The bin zone must be loaded in the current warehouse context before saving.</Alert> : null}
          <TextField label="Code" value={code} onChange={(event) => setCode(event.target.value)} required fullWidth />
          <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
          <TextField label="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" fullWidth />
          <TextField select label="Active" value={active} onChange={(event) => setActive(event.target.value)} fullWidth>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel="Save"
          submittingLabel="Saving bin..."
          helperText="Zone, code, name and active status are required. Capacity is optional."
          loading={loading}
          submitDisabled={!bin || !selectedZoneRow || code.trim().length === 0 || name.trim().length === 0}
          onCancel={onClose}
          onSubmit={() => bin && selectedZoneRow && onSubmit(bin.id, {
            zoneId: selectedZoneRow.id,
            code: code.trim(),
            name: name.trim(),
            capacity: toNullableNumber(capacity),
            active: active === 'true',
            description: description.trim() || null,
          })}
        />
      </DialogContent>
    </Dialog>
  );
}

function SetBinInventoryDialog({
  open,
  selectedBin,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  selectedBin: BinLocationResponse | null;
  onClose: () => void;
  onSubmit: (payload: { binLocationId: number; productId: number; quantity: number }) => void;
  loading: boolean;
}) {
  const [product, setProduct] = useState<LookupOption | null>(null);
  const [quantity, setQuantity] = useState('');

  const qty = Number(quantity);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Set bin inventory</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            This sets product quantity for the selected bin. Backend checks that bin stock does not exceed warehouse inventory.
          </Alert>
          <TextField label="Bin" value={selectedBin ? `${selectedBin.code} · ${selectedBin.name}` : ''} fullWidth disabled />
          <EntityLookupField label="Product" entityType="products" value={product} onChange={setProduct} required />
          <TextField label="Quantity" value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" required fullWidth />
        </Stack>
      </DialogContent>
      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel="Set quantity"
          submittingLabel="Saving quantity..."
          helperText="Product and non-negative quantity are required."
          loading={loading}
          submitDisabled={!selectedBin || !product || !Number.isFinite(qty) || qty < 0}
          onCancel={onClose}
          onSubmit={() => selectedBin && product && onSubmit({ binLocationId: selectedBin.id, productId: product.id, quantity: qty })}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function WarehouseLocationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const routeParams = useParams();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const routeWarehouseId = toNumber(routeParams.warehouseId ?? null);
  const routeZoneId = toNumber(routeParams.zoneId ?? null);
  const routeBinLocationId = toNumber(routeParams.binId ?? null);
  const queryTab = (searchParams.get('tab') as TabKey | null) ?? 'zones';
  const activeTab: TabKey = routeBinLocationId ? 'bin-inventory' : routeZoneId ? 'bins' : routeWarehouseId ? 'zones' : queryTab;
  const warehouseId = routeWarehouseId ?? toNumber(searchParams.get('warehouseId'));
  const zoneId = routeZoneId ?? toNumber(searchParams.get('zoneId'));
  const binLocationId = routeBinLocationId ?? toNumber(searchParams.get('binLocationId'));
  const isWarehouseFlow = Boolean(routeWarehouseId);

  const [warehouse, setWarehouse] = useState<LookupOption | null>(warehouseId ? { id: warehouseId, label: `Warehouse #${warehouseId}` } : null);
  const [zoneSearch, setZoneSearch] = useState('');
  const [zoneTypeFilter, setZoneTypeFilter] = useState<WarehouseZoneType | ''>('');
  const [zoneStatusFilter, setZoneStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [binSearch, setBinSearch] = useState('');
  const [binTypeFilter, setBinTypeFilter] = useState<WarehouseZoneType | ''>('');
  const [binStatusFilter, setBinStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryProduct, setInventoryProduct] = useState<LookupOption | null>(null);
  const [inventoryQuantityMin, setInventoryQuantityMin] = useState('');
  const [inventoryQuantityMax, setInventoryQuantityMax] = useState('');
  const [inventoryReservedFilter, setInventoryReservedFilter] = useState<'all' | 'reserved' | 'not-reserved'>('all');
  const [inventoryAvailableFilter, setInventoryAvailableFilter] = useState<'all' | 'available' | 'not-available'>('all');
  const [movementSearch, setMovementSearch] = useState('');
  const [zoneSort, setZoneSort] = useState<SortState>({ field: 'code', direction: 'asc' });
  const [binSort, setBinSort] = useState<SortState>({ field: 'code', direction: 'asc' });
  const [inventorySort, setInventorySort] = useState<SortState>({ field: 'binLocationCode', direction: 'asc' });

  const zonePage = usePagedState();
  const binPage = usePagedState();
  const inventoryPage = usePagedState();
  const movementPage = usePagedState();

  const [selectedZone, setSelectedZone] = useState<WarehouseZoneResponse | null>(null);
  const [selectedBin, setSelectedBin] = useState<BinLocationResponse | null>(null);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [binDialogOpen, setBinDialogOpen] = useState(false);
  const [binInventoryDialogOpen, setBinInventoryDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<WarehouseZoneResponse | null>(null);
  const [editingBin, setEditingBin] = useState<BinLocationResponse | null>(null);

  const zoneActiveParam = zoneStatusFilter === 'all' ? undefined : zoneStatusFilter === 'active';
  const binActiveParam = binStatusFilter === 'all' ? undefined : binStatusFilter === 'active';
  const inventoryQuantityMinParam = inventoryQuantityMin.trim() === '' ? undefined : Number(inventoryQuantityMin);
  const inventoryQuantityMaxParam = inventoryQuantityMax.trim() === '' ? undefined : Number(inventoryQuantityMax);
  const inventoryReservedParam = inventoryReservedFilter === 'all' ? undefined : inventoryReservedFilter === 'reserved';
  const inventoryAvailableParam = inventoryAvailableFilter === 'all' ? undefined : inventoryAvailableFilter === 'available';

  const setTab = (tab: TabKey) => {
    if (isWarehouseFlow && warehouseId) {
      if (tab === 'zones') navigate(`/warehouses/${warehouseId}/zones`);
      if (tab === 'bins' && zoneId) navigate(`/warehouses/${warehouseId}/zones/${zoneId}`);
      if (tab === 'bin-inventory' && zoneId && binLocationId) navigate(`/warehouses/${warehouseId}/zones/${zoneId}/bins/${binLocationId}`);
      if (tab === 'internal-movements') navigate(`/warehouse-locations?warehouseId=${warehouseId}&tab=internal-movements`);
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  const setWarehouseFilter = (option: LookupOption | null) => {
    setWarehouse(option);
    setSelectedZone(null);
    setSelectedBin(null);
    const next = new URLSearchParams(searchParams);
    if (option) next.set('warehouseId', String(option.id)); else next.delete('warehouseId');
    next.delete('zoneId');
    next.delete('binLocationId');
    setSearchParams(next);
    zonePage.reset(); binPage.reset(); inventoryPage.reset(); movementPage.reset();
  };

  const selectZone = (zone: WarehouseZoneResponse) => {
    setSelectedZone(zone);
    setSelectedBin(null);
    if (isWarehouseFlow || routeWarehouseId) {
      navigate(`/warehouses/${zone.warehouseId}/zones/${zone.id}`);
    } else {
      const next = new URLSearchParams(searchParams);
      next.set('warehouseId', String(zone.warehouseId));
      next.set('zoneId', String(zone.id));
      next.delete('binLocationId');
      next.set('tab', 'bins');
      setSearchParams(next);
    }
    binPage.reset();
  };


  const selectBin = (bin: BinLocationResponse) => {
    setSelectedBin(bin);
    if (isWarehouseFlow || routeWarehouseId) {
      navigate(`/warehouses/${bin.warehouseId}/zones/${bin.zoneId}/bins/${bin.id}`);
    } else {
      const next = new URLSearchParams(searchParams);
      next.set('warehouseId', String(bin.warehouseId));
      next.set('zoneId', String(bin.zoneId));
      next.set('binLocationId', String(bin.id));
      next.set('tab', 'bin-inventory');
      setSearchParams(next);
    }
    inventoryPage.reset();
  };

  const zoneQuery = useWarehouseZones({
    warehouseId,
    search: zoneSearch.trim() || undefined,
    type: zoneTypeFilter || undefined,
    active: zoneActiveParam,
    page: zonePage.page,
    size: zonePage.size,
    sort: buildSortParam(zoneSort),
  });
  const binQuery = useBinLocations({
    warehouseId,
    zoneId,
    search: binSearch.trim() || undefined,
    type: binTypeFilter || undefined,
    active: binActiveParam,
    page: binPage.page,
    size: binPage.size,
    sort: buildSortParam(binSort),
  });
  const inventoryQuery = useBinInventory({
    warehouseId,
    zoneId,
    binLocationId,
    search: inventorySearch.trim() || undefined,
    productId: inventoryProduct?.id,
    quantityMin: Number.isFinite(inventoryQuantityMinParam) ? inventoryQuantityMinParam : undefined,
    quantityMax: Number.isFinite(inventoryQuantityMaxParam) ? inventoryQuantityMaxParam : undefined,
    reserved: inventoryReservedParam,
    available: inventoryAvailableParam,
    page: inventoryPage.page,
    size: inventoryPage.size,
    sort: buildSortParam(inventorySort),
  });
  const movementQuery = useInternalWarehouseMovements({
    warehouseId,
    binLocationId,
    search: movementSearch.trim() || undefined,
    page: movementPage.page,
    size: movementPage.size,
    sort: 'createdAt,desc',
  });

  const zones = zoneQuery.data?.content ?? [];
  const bins = binQuery.data?.content ?? [];
  const inventory = inventoryQuery.data?.content ?? [];
  const movements = movementQuery.data?.content ?? [];

  const currentZone = useMemo(
    () => selectedZone ?? zones.find((zone) => zone.id === zoneId) ?? null,
    [selectedZone, zones, zoneId],
  );
  const currentBin = useMemo(
    () => selectedBin ?? bins.find((bin) => bin.id === binLocationId) ?? null,
    [selectedBin, bins, binLocationId],
  );

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['warehouse-locations'] });
  };

  const zoneMutation = useMutation({
    mutationFn: warehouseLocationsApi.createZone,
    onSuccess: async () => {
      showSnackbar({ message: 'Zone created.', severity: 'success' });
      setZoneDialogOpen(false);
      await invalidateAll();
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const binMutation = useMutation({
    mutationFn: warehouseLocationsApi.createBin,
    onSuccess: async () => {
      showSnackbar({ message: 'Bin created.', severity: 'success' });
      setBinDialogOpen(false);
      await invalidateAll();
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const zoneUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof warehouseLocationsApi.updateZone>[1] }) => warehouseLocationsApi.updateZone(id, payload),
    onSuccess: async (updatedZone) => {
      showSnackbar({ message: 'Zone updated.', severity: 'success' });
      setEditingZone(null);
      setSelectedZone((current) => current?.id === updatedZone.id ? updatedZone : current);
      await invalidateAll();
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const binUpdateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof warehouseLocationsApi.updateBin>[1] }) => warehouseLocationsApi.updateBin(id, payload),
    onSuccess: async (updatedBin) => {
      showSnackbar({ message: 'Bin updated.', severity: 'success' });
      setEditingBin(null);
      setSelectedBin((current) => current?.id === updatedBin.id ? updatedBin : current);
      await invalidateAll();
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const binInventoryMutation = useMutation({
    mutationFn: warehouseLocationsApi.setBinInventory,
    onSuccess: async () => {
      showSnackbar({ message: 'Bin inventory updated.', severity: 'success' });
      setBinInventoryDialogOpen(false);
      await invalidateAll();
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const zoneColumns: DataTableColumn<WarehouseZoneResponse>[] = [
    { id: 'code', header: 'Location / zone', sortField: 'code', render: (row) => <Link component="button" fontWeight={800} onClick={() => selectZone(row)}>{row.code}</Link> },
    { id: 'name', header: 'Name', sortField: 'name', render: (row) => row.name },
    { id: 'warehouse', header: 'Warehouse', sortField: 'warehouseName', render: (row) => row.warehouseName },
    { id: 'type', header: 'Type', sortField: 'type', render: (row) => <Chip size="small" label={row.type} /> },
    { id: 'capacity', header: 'Capacity', sortField: 'capacity', align: 'right', render: (row) => row.capacity ?? '—' },
    { id: 'active', header: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
    {
      id: 'actions',
      header: 'Actions',
      sticky: 'right',
      align: 'right',
      render: (row) => (
        <Button size="small" variant="text" onClick={() => setEditingZone(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const binColumns: DataTableColumn<BinLocationResponse>[] = [
    { id: 'code', header: 'Bin', sortField: 'code', render: (row) => <Link component="button" fontWeight={800} onClick={() => selectBin(row)}>{row.code}</Link> },
    { id: 'name', header: 'Name', sortField: 'name', render: (row) => row.name },
    { id: 'zone', header: 'Location / zone', sortField: 'zoneCode', render: (row) => <Link component="button" onClick={() => selectZone({ id: row.zoneId, warehouseId: row.warehouseId, warehouseName: row.warehouseName, companyId: row.companyId, code: row.zoneCode, name: row.zoneName, type: row.zoneType, capacity: null, active: true, description: null, createdAt: '', updatedAt: null })}>{row.zoneCode} · {row.zoneName}</Link> },
    { id: 'warehouse', header: 'Warehouse', sortField: 'warehouseName', render: (row) => row.warehouseName },
    { id: 'capacity', header: 'Capacity', sortField: 'capacity', align: 'right', render: (row) => row.capacity ?? '—' },
    { id: 'active', header: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
    {
      id: 'actions',
      header: 'Actions',
      sticky: 'right',
      align: 'right',
      render: (row) => (
        <Button size="small" variant="text" onClick={() => setEditingBin(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const inventoryColumns: DataTableColumn<BinInventoryResponse>[] = [
    { id: 'bin', header: 'Bin', sortField: 'binLocationCode', render: (row) => <Link component="button" fontWeight={800} onClick={() => selectBin({ id: row.binLocationId, warehouseId: row.warehouseId, warehouseName: row.warehouseName, zoneId: row.zoneId, zoneCode: row.zoneCode, zoneName: '', zoneType: 'OTHER', companyId: 0, code: row.binLocationCode, name: row.binLocationName, capacity: null, active: true, description: null, createdAt: '', updatedAt: null })}>{row.binLocationCode}</Link> },
    { id: 'product', header: 'Product', sortField: 'productName', render: (row) => `${row.productName} (${row.sku})` },
    { id: 'zone', header: 'Location / zone', sortField: 'zoneCode', render: (row) => row.zoneCode },
    { id: 'quantity', header: 'Quantity', sortField: 'quantity', align: 'right', render: (row) => <Typography fontWeight={800}>{row.quantity}</Typography> },
    { id: 'updated', header: 'Updated', sortField: 'lastUpdated', render: (row) => row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '—' },
  ];

  const movementColumns: DataTableColumn<InternalWarehouseMovementResponse>[] = [
    { id: 'product', header: 'Product', sortField: 'productName', render: (row) => `${row.productName} (${row.sku})` },
    { id: 'route', header: 'Trace', render: (row) => (
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button size="small" component={RouterLink} to={`/warehouses/${row.warehouseId}/zones/${row.sourceBinZoneId}/bins/${row.sourceBinId}`}>{row.sourceBinCode}</Button>
        <Typography variant="body2" color="text.secondary">→</Typography>
        <Button size="small" component={RouterLink} to={`/warehouses/${row.warehouseId}/zones/${row.destinationBinZoneId}/bins/${row.destinationBinId}`}>{row.destinationBinCode}</Button>
      </Stack>
    ) },
    { id: 'quantity', header: 'Quantity', align: 'right', render: (row) => row.quantity },
    { id: 'status', header: 'Status', render: (row) => <Chip size="small" label={row.status} /> },
    { id: 'created', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  const visibleTabs = isWarehouseFlow
    ? tabs.filter((tab) => tab.value === 'zones' || (zoneId && tab.value === 'bins') || (binLocationId && tab.value === 'bin-inventory'))
    : tabs;

  const commonToolbar = (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
      {isWarehouseFlow ? null : <EntityLookupField label="Warehouse filter" entityType="warehouses" value={warehouse} onChange={setWarehouseFilter} />}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {visibleTabs.map((tab) => (
          <Button key={tab.value} variant={activeTab === tab.value ? 'contained' : 'outlined'} onClick={() => setTab(tab.value)}>
            {tab.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );

  const flowBreadcrumbs = isWarehouseFlow ? (
    <Breadcrumbs aria-label="warehouse drill-down">
      <Link component={RouterLink} to={`/warehouses/${warehouseId}`} underline="hover">Warehouse</Link>
      <Link component={RouterLink} to={`/warehouses/${warehouseId}/zones`} underline="hover">Zone</Link>
      {zoneId ? <Link component={RouterLink} to={`/warehouses/${warehouseId}/zones/${zoneId}`} underline="hover">{currentZone ? `${currentZone.code} · ${currentZone.name}` : `Zone #${zoneId}`}</Link> : null}
      {binLocationId ? <Typography color="text.secondary">{currentBin ? `${currentBin.code} · ${currentBin.name}` : `Bin #${binLocationId}`}</Typography> : null}
    </Breadcrumbs>
  ) : null;

  return (
    <Stack spacing={3}>
      {flowBreadcrumbs}

      <PageHeader
        overline="Warehouse operations"
        title={binLocationId ? 'Bin details' : zoneId ? 'Zone details' : 'Warehouse zones'}
        description={binLocationId ? 'Bin inventory is shown from the selected bin details page.' : zoneId ? 'Click a bin row to open bin details and its inventory.' : 'Click a zone row to open zone details and its bins.'}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" onClick={() => setZoneDialogOpen(true)}>New location</Button>
            <Button variant="outlined" onClick={() => setBinDialogOpen(true)}>New bin</Button>
            <Button variant="contained" disabled={!selectedBin && !binLocationId} onClick={() => setBinInventoryDialogOpen(true)}>Set bin inventory</Button>
          </Stack>
        }
      />

      <WarehouseStorageFlowGuide warehouseId={warehouseId} zoneId={zoneId} binId={binLocationId} />

      <SectionCard>{commonToolbar}</SectionCard>

      {currentZone ? <Alert severity="info">Selected location: {currentZone.code} · {currentZone.name}. Bins are filtered by this location.</Alert> : null}
      {currentBin || binLocationId ? <Alert severity="info">Selected bin: {currentBin ? `${currentBin.code} · ${currentBin.name}` : `#${binLocationId}`}. Bin inventory is filtered by this bin.</Alert> : null}

      {activeTab === 'zones' ? (
        <SectionCard title="Locations / zones" description="Search and paginate warehouse locations. Clicking a location drills into its bins.">
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField label="Search code/name" value={zoneSearch} onChange={(event) => { setZoneSearch(event.target.value); zonePage.reset(); }} size="small" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField select label="Type" value={zoneTypeFilter} onChange={(event) => { setZoneTypeFilter(event.target.value as WarehouseZoneType | ''); zonePage.reset(); }} size="small" fullWidth>
                  <MenuItem value="">All types</MenuItem>
                  {zoneTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Status" value={zoneStatusFilter} onChange={(event) => { setZoneStatusFilter(event.target.value as 'all' | 'active' | 'inactive'); zonePage.reset(); }} size="small" fullWidth>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <DataTable
              columns={zoneColumns}
              rows={zones}
              getRowId={(row) => row.id}
              loading={zoneQuery.isLoading}
              error={zoneQuery.isError}
              onRetry={() => zoneQuery.refetch()}
              pagination={zonePage.pagination(zoneQuery.data)}
              sort={zoneSort}
              onSortChange={(next) => { setZoneSort(next); zonePage.reset(); }}
            />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'bins' ? (
        <SectionCard title="Bins" description="Search and paginate bins. Clicking a bin opens its bin inventory.">
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Search code/label" value={binSearch} onChange={(event) => { setBinSearch(event.target.value); binPage.reset(); }} size="small" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Zone" value={zoneId ? String(zoneId) : ''} disabled={Boolean(routeZoneId)} onChange={(event) => { const next = new URLSearchParams(searchParams); if (event.target.value) next.set('zoneId', event.target.value); else next.delete('zoneId'); setSearchParams(next); binPage.reset(); }} size="small" fullWidth>
                  <MenuItem value="">All zones</MenuItem>
                  {zones.map((zone) => <MenuItem key={zone.id} value={String(zone.id)}>{zone.code} · {zone.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField select label="Type" value={binTypeFilter} onChange={(event) => { setBinTypeFilter(event.target.value as WarehouseZoneType | ''); binPage.reset(); }} size="small" fullWidth>
                  <MenuItem value="">All types</MenuItem>
                  {zoneTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField select label="Status" value={binStatusFilter} onChange={(event) => { setBinStatusFilter(event.target.value as 'all' | 'active' | 'inactive'); binPage.reset(); }} size="small" fullWidth>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <DataTable
              columns={binColumns}
              rows={bins}
              getRowId={(row) => row.id}
              loading={binQuery.isLoading}
              error={binQuery.isError}
              onRetry={() => binQuery.refetch()}
              pagination={binPage.pagination(binQuery.data)}
              sort={binSort}
              onSortChange={(next) => { setBinSort(next); binPage.reset(); }}
            />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'bin-inventory' ? (
        <SectionCard title="Bin inventory" description="Search/paginate inventory rows for selected warehouse, location or bin. This is physical stock placement, not initial stock creation.">
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Search product/code/SKU" value={inventorySearch} onChange={(event) => { setInventorySearch(event.target.value); inventoryPage.reset(); }} size="small" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <EntityLookupField label="Product filter" entityType="products" value={inventoryProduct} onChange={(option) => { setInventoryProduct(option); inventoryPage.reset(); }} />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField label="Qty min" value={inventoryQuantityMin} onChange={(event) => { setInventoryQuantityMin(event.target.value); inventoryPage.reset(); }} size="small" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField label="Qty max" value={inventoryQuantityMax} onChange={(event) => { setInventoryQuantityMax(event.target.value); inventoryPage.reset(); }} size="small" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select label="Reserved warehouse stock" value={inventoryReservedFilter} onChange={(event) => { setInventoryReservedFilter(event.target.value as 'all' | 'reserved' | 'not-reserved'); inventoryPage.reset(); }} size="small" fullWidth>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="reserved">Has reserved</MenuItem>
                  <MenuItem value="not-reserved">No reserved</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select label="Available warehouse stock" value={inventoryAvailableFilter} onChange={(event) => { setInventoryAvailableFilter(event.target.value as 'all' | 'available' | 'not-available'); inventoryPage.reset(); }} size="small" fullWidth>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="available">Has available</MenuItem>
                  <MenuItem value="not-available">No available</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <DataTable
              columns={inventoryColumns}
              rows={inventory}
              getRowId={(row) => `${row.binLocationId}-${row.productId}`}
              loading={inventoryQuery.isLoading}
              error={inventoryQuery.isError}
              onRetry={() => inventoryQuery.refetch()}
              pagination={inventoryPage.pagination(inventoryQuery.data)}
              sort={inventorySort}
              onSortChange={(next) => { setInventorySort(next); inventoryPage.reset(); }}
            />
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'internal-movements' ? (
        <SectionCard title="Internal movements" description="Bin-to-bin movement trace. Warehouse inventory is unchanged by these movements.">
          <Stack spacing={2}>
            <TextField label="Search internal movements" value={movementSearch} onChange={(event) => { setMovementSearch(event.target.value); movementPage.reset(); }} size="small" fullWidth />
            <DataTable
              columns={movementColumns}
              rows={movements}
              getRowId={(row) => row.id}
              loading={movementQuery.isLoading}
              error={movementQuery.isError}
              onRetry={() => movementQuery.refetch()}
              pagination={movementPage.pagination(movementQuery.data)}
            />
          </Stack>
        </SectionCard>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Alert severity="info">
            Dodavanje lokacije: izabere se warehouse, unesu se code/name/type/capacity. Dodavanje bin-a: prvo mora da postoji lokacija/zone u istom warehouse-u. Dodavanje bin inventory-ja: bira se bin + product + quantity; backend odbija negativno stanje i količinu veću od warehouse inventory-ja.
          </Alert>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Alert severity="warning">
            Initial stock nije isto što i bin inventory. Initial stock ostaje deo stock movement/inventory toka; bin inventory samo raspoređuje već postojeću warehouse količinu po binovima.
          </Alert>
        </Grid>
      </Grid>

      <CreateZoneDialog
        open={zoneDialogOpen}
        warehouse={warehouse}
        onClose={() => setZoneDialogOpen(false)}
        loading={zoneMutation.isPending}
        onSubmit={(payload) => zoneMutation.mutate(payload)}
      />
      <CreateBinDialog
        open={binDialogOpen}
        warehouse={warehouse}
        selectedZone={currentZone}
        zones={zones}
        onClose={() => setBinDialogOpen(false)}
        loading={binMutation.isPending}
        onSubmit={(payload) => binMutation.mutate(payload)}
      />
      <EditZoneDialog
        open={Boolean(editingZone)}
        zone={editingZone}
        onClose={() => setEditingZone(null)}
        loading={zoneUpdateMutation.isPending}
        onSubmit={(id, payload) => zoneUpdateMutation.mutate({ id, payload })}
      />
      <EditBinDialog
        open={Boolean(editingBin)}
        bin={editingBin}
        zones={zones}
        onClose={() => setEditingBin(null)}
        loading={binUpdateMutation.isPending}
        onSubmit={(id, payload) => binUpdateMutation.mutate({ id, payload })}
      />
      <SetBinInventoryDialog
        open={binInventoryDialogOpen}
        selectedBin={currentBin}
        onClose={() => setBinInventoryDialogOpen(false)}
        loading={binInventoryMutation.isPending}
        onSubmit={(payload) => binInventoryMutation.mutate(payload)}
      />
    </Stack>
  );
}
