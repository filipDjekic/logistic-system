import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { invalidateShiftState } from '../../../core/utils/invalidateAppState';
import { formatTemporalView } from '../../../core/utils/timezoneFormat';
import { normalizeApiError } from '../../../core/api/apiError';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel, DomainEventsPanel } from '../../../shared/components/OperationalPanels';
import { ForbiddenTransitionHint, LifecycleHistoryTimeline } from '../../../shared/components/Lifecycle';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { employeesApi } from '../../employees/api/employeesApi';
import { warehousesApi } from '../../warehouses/api/warehousesApi';
import ShiftFormDialog from '../components/ShiftFormDialog';
import ShiftLifecycleCard from '../components/ShiftLifecycleCard';
import ShiftStatusChip from '../components/ShiftStatusChip';
import { useCreateShift } from '../hooks/useCreateShift';
import { useShift } from '../hooks/useShift';
import { isShiftCancellable, isShiftEditable } from '../utils/shiftLifecycle';

type ShiftDetailsTab = 'overview' | 'lifecycle' | 'domainEvents' | 'changeHistory';

export default function ShiftDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const shiftId = Number(params.id);
  const isValidShiftId = Number.isInteger(shiftId) && shiftId > 0;
  const [activeTab, setActiveTab] = useState<ShiftDetailsTab>('overview');
  const [editOpen, setEditOpen] = useState(false);

  const shiftQuery = useShift(isValidShiftId ? shiftId : null);
  const saveShiftMutation = useCreateShift();
  const canManageShifts = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.HR_MANAGER;
  const canViewHistory = auth.user?.role !== ROLES.DRIVER && auth.user?.role !== ROLES.WORKER;

  const employeesQuery = useQuery({
    queryKey: ['shifts', shiftId, 'employee', shiftQuery.data?.employeeId],
    queryFn: () => employeesApi.getById(Number(shiftQuery.data?.employeeId)),
    enabled: isValidShiftId && shiftQuery.data?.employeeId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const warehouseQuery = useQuery({
    queryKey: ['shifts', shiftId, 'warehouse', shiftQuery.data?.warehouseId],
    queryFn: () => warehousesApi.getById(Number(shiftQuery.data?.warehouseId)),
    enabled: isValidShiftId && shiftQuery.data?.warehouseId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!shiftQuery.data || ['FINISHED', 'CANCELLED'].includes(shiftQuery.data.status)) return undefined;
    const intervalId = window.setInterval(() => { void invalidateShiftState(queryClient, shiftId); }, 30000);
    return () => window.clearInterval(intervalId);
  }, [queryClient, shiftId, shiftQuery.data]);

  if (!isValidShiftId) return <ErrorState title="Invalid shift" description="The shift ID in the route must be a positive integer." />;

  if (shiftQuery.isLoading) {
    return (
      <EntityDetailsLayout overline="Workforce" title="Shift Details" actions={<Button variant="outlined" onClick={() => navigate('/shifts')}>Back to list</Button>}>
        <SectionCard><Typography color="text.secondary">Loading shift details...</Typography></SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (shiftQuery.isError || !shiftQuery.data) {
    const error = normalizeApiError(shiftQuery.error, 'The shift could not be loaded from the backend.');
    return (
      <EntityDetailsLayout overline="Workforce" title="Shift Details" actions={<Button variant="outlined" onClick={() => navigate('/shifts')}>Back to list</Button>}>
        <ErrorState title={error.status === 403 ? 'Access denied' : error.status === 404 ? 'Shift not found' : 'Shift could not be loaded'} description={error.message} details={error.fieldErrors} onRetry={() => void shiftQuery.refetch()} />
      </EntityDetailsLayout>
    );
  }

  const shift = shiftQuery.data;
  const employee = employeesQuery.data ?? null;
  const warehouse = warehouseQuery.data ?? null;
  const canEdit = canManageShifts && isShiftEditable(shift);
  const canCancel = canManageShifts && isShiftCancellable(shift);

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history', disabled: !canViewHistory },
  ];

  return (
    <EntityDetailsLayout
      overline="Workforce"
      title={`Shift #${shift.id}`}
      description="Review employee shift timing, assignment, warehouse coverage and lifecycle state."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as ShiftDetailsTab)}
      actions={(
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={() => navigate('/shifts')}>Back to list</Button>
          {canManageShifts ? <Button variant="outlined" disabled={!canEdit} onClick={() => setEditOpen(true)}>Edit</Button> : null}
          {canManageShifts ? <Button variant="contained" color="warning" disabled={!canCancel || saveShiftMutation.isPending} onClick={() => saveShiftMutation.mutate({ mode: 'cancel', id: shift.id })}>Cancel shift</Button> : null}
        </Stack>
      )}
    >
      {activeTab === 'overview' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionCard title="Shift overview" description="Core scheduling data and operational assignment.">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><Typography variant="subtitle2" color="text.secondary">Status</Typography><ShiftStatusChip value={shift.status} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Typography variant="subtitle2" color="text.secondary">Timezone</Typography><Typography>{shift.timezoneDisplayName ? `${shift.timezoneDisplayName} (${shift.timezoneName ?? shift.timezone ?? 'timezone'})` : shift.timezoneName ?? shift.timezone ?? `Timezone #${shift.timezoneId}`}</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Typography variant="subtitle2" color="text.secondary">Start</Typography><Typography>{formatTemporalView(shift.startTimeView, shift.startTime)}</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Typography variant="subtitle2" color="text.secondary">End</Typography><Typography>{formatTemporalView(shift.endTimeView, shift.endTime)}</Typography></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
                  <Button component={RouterLink} to={`/employees/${shift.employeeId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${shift.employeeId}`}</Button>
                  <Typography variant="body2" color="text.secondary">{employee ? `${employee.email} · ${employee.position}` : '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Warehouse</Typography>
                  {shift.warehouseId ? <Button component={RouterLink} to={`/warehouses/${shift.warehouseId}`} size="small" sx={{ px: 0, minWidth: 0 }}>{warehouse?.name ?? shift.warehouseName ?? `Warehouse #${shift.warehouseId}`}</Button> : <Typography>—</Typography>}
                  <Typography variant="body2" color="text.secondary">{warehouse?.status ?? '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}><Typography variant="subtitle2" color="text.secondary">Notes</Typography><Typography>{shift.notes?.trim() || '—'}</Typography></Grid>
              </Grid>
            </SectionCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}><ShiftLifecycleCard shift={shift} /></Grid>
          {canManageShifts && !canEdit ? <Grid size={{ xs: 12 }}><SectionCard title="Mutation guard" description="Shift edit and cancel actions are available only while the shift is planned."><ForbiddenTransitionHint visible message="This shift is not PLANNED, so the edit and cancel actions are disabled by lifecycle rules." /></SectionCard></Grid> : null}
        </Grid>
      ) : null}

      {activeTab === 'lifecycle' ? <Grid container spacing={3}><Grid size={{ xs: 12 }}><ShiftLifecycleCard shift={shift} /></Grid><Grid size={{ xs: 12 }}><LifecycleHistoryTimeline entityName="SHIFT" entityId={shift.id} title="Shift lifecycle history" /></Grid></Grid> : null}
      {activeTab === 'domainEvents' ? <DomainEventsPanel entityType="SHIFT" entityId={shift.id} /> : null}
      {activeTab === 'changeHistory' && canViewHistory ? <ChangeHistoryPanel entityName="SHIFT" entityId={shift.id} /> : null}
      {activeTab === 'changeHistory' && !canViewHistory ? <EmptyState title="History unavailable" description="Your role cannot view shift change history." /> : null}

      {canManageShifts ? (
        <ShiftFormDialog
          open={editOpen}
          mode="edit"
          initialData={shift}
          employees={employee ? [{ id: employee.id, firstName: employee.firstName, lastName: employee.lastName, email: employee.email }] : []}
          loading={saveShiftMutation.isPending}
          serverError={saveShiftMutation.error}
          onClose={() => setEditOpen(false)}
          onSubmit={(values) => saveShiftMutation.mutate({ mode: 'edit', id: shift.id, data: { startTime: values.startTime, endTime: values.endTime, notes: values.notes.trim(), timezoneId: Number(values.timezoneId), warehouseId: values.warehouseId ? Number(values.warehouseId) : null } }, { onSuccess: () => setEditOpen(false) })}
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
