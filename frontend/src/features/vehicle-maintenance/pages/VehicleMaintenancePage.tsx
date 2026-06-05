import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
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
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { DEFAULT_PAGE_SIZE } from '../../../core/api/pagination';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import { useCreateVehicleMaintenance, useVehicleMaintenanceAction } from '../hooks/useVehicleMaintenanceMutations';
import { useVehicleMaintenance } from '../hooks/useVehicleMaintenance';
import type { VehicleMaintenanceStatus, VehicleMaintenanceType } from '../types/vehicleMaintenance.types';

const maintenanceTypes: VehicleMaintenanceType[] = ['ROUTINE_SERVICE', 'REPAIR', 'INSPECTION', 'TIRE_CHANGE', 'OIL_CHANGE', 'CLEANING', 'OTHER'];
const maintenanceStatuses: Array<VehicleMaintenanceStatus | 'ALL'> = ['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

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

export default function VehicleMaintenancePage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<VehicleMaintenanceStatus | 'ALL'>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<LookupOption | null>(null);
  const [type, setType] = useState<VehicleMaintenanceType>('ROUTINE_SERVICE');
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [notes, setNotes] = useState('');

  const maintenanceQuery = useVehicleMaintenance({
    page,
    size,
    vehicleId: selectedVehicle?.id,
    status: status === 'ALL' ? undefined : status,
  });
  const createMutation = useCreateVehicleMaintenance();
  const actionMutation = useVehicleMaintenanceAction();

  const rows = maintenanceQuery.data?.content ?? [];
  const canSubmit = Boolean(selectedVehicle?.id) && scheduledAt.trim().length > 0;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Fleet operations"
        title="Vehicle maintenance"
        description="Schedule maintenance, block vehicles from transport assignment, and track maintenance lifecycle."
      />

      <SectionCard title="Schedule maintenance" description="Planned maintenance blocks the vehicle from new transport assignment.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <EntityLookupField
              label="Vehicle"
              entityType="vehicles"
              value={selectedVehicle}
              onChange={setSelectedVehicle}
              required
              placeholder="Choose vehicle"
              searchPlaceholder="Search vehicles by registration, brand or model..."
              sort="registrationNumber,asc"
            />
          </Grid>
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
                if (!selectedVehicle?.id) return;
                createMutation.mutate({ vehicleId: selectedVehicle.id, type, scheduledAt, notes: notes.trim() || undefined });
              }}
            >
              Schedule
            </Button>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} multiline minRows={2} fullWidth />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Maintenance records" action={
        <Stack direction="row" spacing={1}>
          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as VehicleMaintenanceStatus | 'ALL')} sx={{ minWidth: 180 }}>
            {maintenanceStatuses.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </TextField>
        </Stack>
      }>
        {maintenanceQuery.isError ? <Alert severity="error">Unable to load maintenance records.</Alert> : null}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
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
                  <TableCell>{row.vehicleRegistrationNumber}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell><Chip size="small" label={row.status} color={statusColor(row.status)} /></TableCell>
                  <TableCell>{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{row.startedAt ? new Date(row.startedAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" disabled={row.status !== 'PLANNED' || actionMutation.isPending} onClick={() => actionMutation.mutate({ id: row.id, action: 'start' })}>Start</Button>
                      <Button size="small" disabled={row.status !== 'IN_PROGRESS' || actionMutation.isPending} onClick={() => actionMutation.mutate({ id: row.id, action: 'complete' })}>Complete</Button>
                      <Button size="small" color="error" disabled={(row.status === 'COMPLETED' || row.status === 'CANCELLED') || actionMutation.isPending} onClick={() => actionMutation.mutate({ id: row.id, action: 'cancel', reason: 'Cancelled from UI' })}>Cancel</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={7}><Typography color="text.secondary">No maintenance records.</Typography></TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <ServerTablePagination page={maintenanceQuery.data} disabled={maintenanceQuery.isFetching} onPageChange={setPage} onSizeChange={(value) => { setSize(value); setPage(0); }} />
      </SectionCard>
    </Stack>
  );
}
