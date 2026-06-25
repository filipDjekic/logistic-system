import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { DEFAULT_PAGE_SIZE } from '../../../core/api/pagination';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import { useCreateVehicleMaintenance, useUpdateVehicleMaintenance, useVehicleMaintenanceAction } from '../hooks/useVehicleMaintenanceMutations';
import { useVehicleMaintenance } from '../hooks/useVehicleMaintenance';
import type { VehicleMaintenanceResponse, VehicleMaintenanceStatus, VehicleMaintenanceType } from '../types/vehicleMaintenance.types';

const maintenanceTypes: VehicleMaintenanceType[] = ['ROUTINE_SERVICE', 'REPAIR', 'INSPECTION', 'TIRE_CHANGE', 'OIL_CHANGE', 'CLEANING', 'OTHER'];
const maintenanceStatuses: Array<VehicleMaintenanceStatus | 'ALL'> = ['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

type MaintenanceFormState = {
  type: VehicleMaintenanceType;
  scheduledAt: string;
  odometer: string;
  cost: string;
  notes: string;
};

type VehicleMaintenanceSectionProps = {
  fixedVehicle?: LookupOption;
  canManage?: boolean;
};

function statusColor(status: VehicleMaintenanceStatus) {
  if (status === 'COMPLETED') return 'success';
  if (status === 'IN_PROGRESS') return 'warning';
  if (status === 'CANCELLED') return 'default';
  return 'info';
}

function toLocalInput(value: Date) {
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function dateTimeToLocalInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return toLocalInput(date);
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function maintenanceToForm(row: VehicleMaintenanceResponse): MaintenanceFormState {
  return {
    type: row.type,
    scheduledAt: dateTimeToLocalInput(row.scheduledAt),
    odometer: row.odometer == null ? '' : String(row.odometer),
    cost: row.cost == null ? '' : String(row.cost),
    notes: row.notes ?? '',
  };
}

export default function VehicleMaintenanceSection({ fixedVehicle, canManage = true }: VehicleMaintenanceSectionProps) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<VehicleMaintenanceStatus | 'ALL'>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<LookupOption | null>(fixedVehicle ?? null);
  const [type, setType] = useState<VehicleMaintenanceType>('ROUTINE_SERVICE');
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [editingRow, setEditingRow] = useState<VehicleMaintenanceResponse | null>(null);
  const [editForm, setEditForm] = useState<MaintenanceFormState>({
    type: 'ROUTINE_SERVICE',
    scheduledAt: '',
    odometer: '',
    cost: '',
    notes: '',
  });

  const vehicle = fixedVehicle ?? selectedVehicle;
  const maintenanceQuery = useVehicleMaintenance({
    page,
    size,
    vehicleId: vehicle?.id,
    status: status === 'ALL' ? undefined : status,
    sort: 'scheduledAt,desc',
  });
  const createMutation = useCreateVehicleMaintenance();
  const updateMutation = useUpdateVehicleMaintenance();
  const actionMutation = useVehicleMaintenanceAction();

  const rows = maintenanceQuery.data?.content ?? [];
  const canSubmit = Boolean(vehicle?.id) && scheduledAt.trim().length > 0;
  const canSubmitEdit = Boolean(editingRow?.id) && editForm.scheduledAt.trim().length > 0;

  useEffect(() => {
    if (fixedVehicle) {
      setSelectedVehicle(fixedVehicle);
      setPage(0);
    }
  }, [fixedVehicle]);

  useEffect(() => {
    if (editingRow) {
      setEditForm(maintenanceToForm(editingRow));
    }
  }, [editingRow]);

  return (
    <Stack spacing={3}>
      {canManage ? (
      <SectionCard title="Schedule maintenance" description="Planned maintenance blocks the vehicle from new transport assignment.">
        <Grid container spacing={2}>
          {!fixedVehicle ? (
            <Grid size={{ xs: 12, md: 4 }}>
              <EntityLookupField
                label="Vehicle"
                entityType="vehicles"
                value={selectedVehicle}
                onChange={(value) => { setSelectedVehicle(value); setPage(0); }}
                required
                placeholder="Choose vehicle"
                searchPlaceholder="Search vehicles by registration, brand or model..."
                sort="registrationNumber,asc"
              />
            </Grid>
          ) : (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Vehicle" value={fixedVehicle.label} InputProps={{ readOnly: true }} fullWidth />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField select label="Type" value={type} onChange={(event) => setType(event.target.value as VehicleMaintenanceType)} fullWidth>
              {maintenanceTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Scheduled at" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: '100%' }}
              disabled={!canSubmit || createMutation.isPending}
              onClick={() => {
                if (!vehicle?.id) return;
                createMutation.mutate(
                  {
                    vehicleId: vehicle.id,
                    type,
                    scheduledAt,
                    odometer: toOptionalNumber(odometer),
                    cost: toOptionalNumber(cost),
                    notes: notes.trim() || undefined,
                  },
                  {
                    onSuccess: () => {
                      setOdometer('');
                      setCost('');
                      setNotes('');
                      void maintenanceQuery.refetch();
                    },
                  },
                );
              }}
            >
              Schedule
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Odometer" type="number" value={odometer} onChange={(event) => setOdometer(event.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField label="Cost" type="number" value={cost} onChange={(event) => setCost(event.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} multiline minRows={2} fullWidth />
          </Grid>
        </Grid>
      </SectionCard>
      ) : null}

      <SectionCard title="Maintenance records" action={
        <TextField select size="small" label="Status" value={status} onChange={(event) => { setStatus(event.target.value as VehicleMaintenanceStatus | 'ALL'); setPage(0); }} sx={{ minWidth: 180 }}>
          {maintenanceStatuses.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
      }>
        {maintenanceQuery.isError ? <Alert severity="error">Unable to load maintenance records.</Alert> : null}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {!fixedVehicle ? <TableCell>Vehicle</TableCell> : null}
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  {!fixedVehicle ? <TableCell>{row.vehicleRegistrationNumber}</TableCell> : null}
                  <TableCell>{row.type}</TableCell>
                  <TableCell><Chip size="small" label={row.status} color={statusColor(row.status)} /></TableCell>
                  <TableCell>{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{row.startedAt ? new Date(row.startedAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    {canManage ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" disabled={row.status !== 'PLANNED' || updateMutation.isPending} onClick={() => setEditingRow(row)}>Edit</Button>
                        <Button size="small" disabled={row.status !== 'PLANNED' || actionMutation.isPending} onClick={() => actionMutation.mutate({ id: row.id, action: 'start' })}>Start</Button>
                        <Button size="small" disabled={row.status !== 'IN_PROGRESS' || actionMutation.isPending} onClick={() => actionMutation.mutate({ id: row.id, action: 'complete' })}>Complete</Button>
                        <Button size="small" color="error" disabled={(row.status === 'COMPLETED' || row.status === 'CANCELLED') || actionMutation.isPending} onClick={() => actionMutation.mutate({ id: row.id, action: 'cancel', reason: 'Cancelled from UI' })}>Cancel</Button>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Read only</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={fixedVehicle ? 6 : 7}><Typography color="text.secondary">No maintenance records.</Typography></TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <ServerTablePagination page={maintenanceQuery.data} disabled={maintenanceQuery.isFetching} onPageChange={setPage} onSizeChange={(value) => { setSize(value); setPage(0); }} />
      </SectionCard>

      <Dialog open={canManage && Boolean(editingRow)} onClose={() => setEditingRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit planned maintenance</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Only planned maintenance can be edited. Started, completed and cancelled records stay immutable.
            </Typography>
            <TextField select label="Type" value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value as VehicleMaintenanceType }))} fullWidth>
              {maintenanceTypes.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <TextField label="Scheduled at" type="datetime-local" value={editForm.scheduledAt} onChange={(event) => setEditForm((current) => ({ ...current, scheduledAt: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Odometer" type="number" value={editForm.odometer} onChange={(event) => setEditForm((current) => ({ ...current, odometer: event.target.value }))} fullWidth />
            <TextField label="Cost" type="number" value={editForm.cost} onChange={(event) => setEditForm((current) => ({ ...current, cost: event.target.value }))} fullWidth />
            <TextField label="Notes" value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} multiline minRows={3} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRow(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!canSubmitEdit || updateMutation.isPending || editingRow?.status !== 'PLANNED'}
            onClick={() => {
              if (!editingRow) return;
              updateMutation.mutate(
                {
                  id: editingRow.id,
                  payload: {
                    type: editForm.type,
                    scheduledAt: editForm.scheduledAt,
                    odometer: toOptionalNumber(editForm.odometer),
                    cost: toOptionalNumber(editForm.cost),
                    notes: editForm.notes.trim() || null,
                  },
                },
                { onSuccess: () => setEditingRow(null) },
              );
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
