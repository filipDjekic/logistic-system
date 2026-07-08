import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import FormActions from '../../../shared/components/Form/FormActions';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { useAuthStore } from '../../../core/auth/authStore';
import { canManageTransportOrders } from '../../../core/permissions/operationGuards';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import { useCreateTransportOrder } from '../hooks/useCreateTransportOrder';
import { useTransportOrder } from '../hooks/useTransportOrder';
import { useUpdateTransportOrder } from '../hooks/useUpdateTransportOrder';
import type { TransportOrderPriority } from '../types/transportOrder.types';
import { transportOrderPriorityOptions } from '../validation/transportOrderSchema';

type Props = {
  mode: 'create' | 'edit';
};

function toInputDateTime(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function generateOrderNumber() {
  const now = new Date();
  const pad = (part: number, size = 2) => String(part).padStart(size, '0');
  return `TO-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
}

function getDateTimeError(departureTime: string, plannedArrivalTime: string) {
  if (!departureTime || !plannedArrivalTime) return null;
  return new Date(departureTime).getTime() < new Date(plannedArrivalTime).getTime()
    ? null
    : 'Departure time must be before planned arrival time.';
}

export default function TransportOrderFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuthStore();
  const canManage = canManageTransportOrders(auth.user?.role);
  const orderId = useMemo(() => Number(params.id), [params.id]);
  const isEdit = mode === 'edit';
  const isValidEditRoute = !isEdit || (Number.isInteger(orderId) && orderId > 0);
  const orderQuery = useTransportOrder(isEdit && isValidEditRoute ? orderId : null);
  const createMutation = useCreateTransportOrder();
  const updateMutation = useUpdateTransportOrder();

  const [orderNumber, setOrderNumber] = useState(generateOrderNumber);
  const [description, setDescription] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [plannedArrivalTime, setPlannedArrivalTime] = useState('');
  const [priority, setPriority] = useState<TransportOrderPriority>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState<LookupOption | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<LookupOption | null>(null);
  const [vehicle, setVehicle] = useState<LookupOption | null>(null);
  const [assignedEmployee, setAssignedEmployee] = useState<LookupOption | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isEdit || orderDate) return;
    const now = new Date();
    setOrderDate(toInputDateTime(now.toISOString()));
  }, [isEdit, orderDate]);

  useEffect(() => {
    if (!isEdit || !orderQuery.data) return;
    const order = orderQuery.data;
    setOrderNumber(order.orderNumber);
    setDescription(order.description ?? '');
    setOrderDate(toInputDateTime(order.orderDate));
    setDepartureTime(toInputDateTime(order.departureTime));
    setPlannedArrivalTime(toInputDateTime(order.plannedArrivalTime));
    setPriority(order.priority);
    setNotes(order.notes ?? '');
    setSourceWarehouse({ id: order.sourceWarehouseId, label: `Warehouse #${order.sourceWarehouseId}` });
    setDestinationWarehouse({ id: order.destinationWarehouseId, label: `Warehouse #${order.destinationWarehouseId}` });
    setVehicle({ id: order.vehicleId, label: `Vehicle #${order.vehicleId}` });
    setAssignedEmployee({ id: order.assignedEmployeeId, label: `Employee #${order.assignedEmployeeId}` });
  }, [isEdit, orderQuery.data]);

  if (!canManage) {
    return <ErrorState title="Access denied" description="Transport orders can be created and edited only by overlord or dispatcher roles." />;
  }

  if (!isValidEditRoute) {
    return <ErrorState title="Invalid transport order edit route" description="Transport order ID must be a positive integer." />;
  }

  if (isEdit && orderQuery.isLoading) {
    return <InlineLoader message="Loading transport order..." />;
  }

  if (isEdit && (orderQuery.isError || !orderQuery.data)) {
    return (
      <ErrorState
        title="Transport order could not be loaded"
        description="The requested transport order was not found or could not be loaded."
        onRetry={() => {
          void orderQuery.refetch();
        }}
      />
    );
  }

  const dateTimeError = getDateTimeError(departureTime, plannedArrivalTime);
  const sameWarehouseError = sourceWarehouse !== null && destinationWarehouse !== null && sourceWarehouse.id === destinationWarehouse.id;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const disableSubmit =
    isSubmitting ||
    !orderNumber.trim() ||
    !description.trim() ||
    !orderDate ||
    !departureTime ||
    !plannedArrivalTime ||
    !sourceWarehouse ||
    !destinationWarehouse ||
    !vehicle ||
    !assignedEmployee ||
    Boolean(dateTimeError) ||
    sameWarehouseError;

  const handleSubmit = () => {
    setSubmitted(true);
    if (disableSubmit || !sourceWarehouse || !destinationWarehouse || !vehicle || !assignedEmployee) return;

    const payload = {
      orderNumber: orderNumber.trim(),
      description: description.trim(),
      orderDate,
      departureTime,
      plannedArrivalTime,
      priority,
      notes: notes.trim() || undefined,
      sourceWarehouseId: sourceWarehouse.id,
      destinationWarehouseId: destinationWarehouse.id,
      vehicleId: vehicle.id,
      assignedEmployeeId: assignedEmployee.id,
    };

    if (isEdit) {
      if (!orderQuery.data) return;

      updateMutation.mutate(
        { id: orderId, payload: { ...payload, expectedVersion: orderQuery.data.version } },
        { onSuccess: (order) => navigate(`/transport-orders/${order.id}`) },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (order) => navigate(`/transport-orders/${order.id}`),
    });
  };

  const title = isEdit ? 'Edit transport order' : 'Create transport order';
  const descriptionText = isEdit
    ? 'Update route, schedule, vehicle and driver from one full page.'
    : 'Order number is generated automatically. Select route, vehicle and driver from searchable tables.';

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title={title}
        description={descriptionText}
        actions={
          <Button variant="outlined" onClick={() => navigate('/transport-orders')} disabled={isSubmitting}>
            Back to list
          </Button>
        }
      />

      <SectionCard title="Basic info" description="Static values stay as select fields. Dynamic records are selected below from search tables.">
        <Stack spacing={2.5}>
          {!isEdit ? (
            <Alert severity="info">
              Order number format: TO-YYYYMMDD-HHMMSSmmm.
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Order number" value={orderNumber} fullWidth required disabled />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select label="Priority" value={priority} fullWidth required onChange={(event) => setPriority(event.target.value as TransportOrderPriority)} disabled={isSubmitting}>
                {transportOrderPriorityOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                error={submitted && !description.trim()}
                helperText={submitted && !description.trim() ? 'Description is required.' : undefined}
                fullWidth
                required
                multiline
                minRows={3}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        </Stack>
      </SectionCard>

      <SectionCard title="Schedule" description="Planned arrival must be after departure time.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Order date" type="datetime-local" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} error={submitted && !orderDate} helperText={submitted && !orderDate ? 'Order date is required.' : undefined} fullWidth required disabled={isSubmitting} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Departure time" type="datetime-local" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} error={submitted && !departureTime} helperText={submitted && !departureTime ? 'Departure time is required.' : undefined} fullWidth required disabled={isSubmitting} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Planned arrival time" type="datetime-local" value={plannedArrivalTime} onChange={(event) => setPlannedArrivalTime(event.target.value)} error={submitted && (!plannedArrivalTime || Boolean(dateTimeError))} helperText={submitted && !plannedArrivalTime ? 'Planned arrival time is required.' : submitted ? dateTimeError ?? undefined : undefined} fullWidth required disabled={isSubmitting} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Route and assignment" description="Warehouses, vehicle and driver are not static values, so they use search result tables with explicit Select buttons.">
        <Stack spacing={2.5}>
          {submitted && sameWarehouseError ? <Alert severity="error">Source and destination warehouses must be different.</Alert> : null}
          {submitted && (!sourceWarehouse || !destinationWarehouse || !vehicle || !assignedEmployee) ? <Alert severity="error">Select source warehouse, destination warehouse, vehicle and driver.</Alert> : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <EntityLookupField label="Source warehouse" entityType="warehouses" value={sourceWarehouse} onChange={setSourceWarehouse} required disabled={isSubmitting} error={submitted && !sourceWarehouse} helperText={submitted && !sourceWarehouse ? 'Source warehouse is required.' : undefined} disabledOptionIds={destinationWarehouse ? [destinationWarehouse.id] : []} searchPlaceholder="Search warehouses..." />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <EntityLookupField label="Destination warehouse" entityType="warehouses" value={destinationWarehouse} onChange={setDestinationWarehouse} required disabled={isSubmitting} error={submitted && !destinationWarehouse} helperText={submitted && !destinationWarehouse ? 'Destination warehouse is required.' : undefined} disabledOptionIds={sourceWarehouse ? [sourceWarehouse.id] : []} searchPlaceholder="Search warehouses..." />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <EntityLookupField label="Vehicle" entityType="vehicles" value={vehicle} onChange={setVehicle} required disabled={isSubmitting} error={submitted && !vehicle} helperText={submitted && !vehicle ? 'Vehicle is required.' : undefined} searchPlaceholder="Search vehicles..." lookupParams={{
                status: 'AVAILABLE',
                available: true,
              }}  />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <EntityLookupField
                label="Driver"
                value={assignedEmployee}
                onChange={setAssignedEmployee}
                entityType="employees"
                disabled={
                  isSubmitting ||
                  !departureTime ||
                  !plannedArrivalTime ||
                  Boolean(dateTimeError)
                }
                lookupParams={{
                  position: 'DRIVER',
                  active: true,
                  availableFrom: departureTime || undefined,
                  availableTo: plannedArrivalTime || undefined,
                }}
                error={submitted && !assignedEmployee}
                helperText={
                  submitted && !assignedEmployee
                    ? 'Driver is required.'
                    : departureTime && plannedArrivalTime && !dateTimeError
                      ? 'Only drivers with a planned or active shift covering the full transport interval are shown.'
                      : 'Select a valid departure and arrival time first.'
                }
              />
            </Grid>
          </Grid>
        </Stack>
      </SectionCard>

      <SectionCard title="Notes" description="Optional internal notes for dispatch planning.">
        <TextField label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} fullWidth multiline minRows={3} disabled={isSubmitting} inputProps={{ maxLength: 255 }} />
      </SectionCard>

      <FormGlobalError error={createMutation.error ?? updateMutation.error} />

      <Divider />

      <FormActions
        cancelLabel="Cancel"
        submitLabel={isEdit ? 'Update transport order' : 'Create transport order'}
        submittingLabel={isEdit ? 'Updating transport order...' : 'Creating transport order...'}
        helperText="Route, vehicle, driver and schedule must be valid before saving. Status changes use lifecycle actions."
        loading={isSubmitting}
        submitDisabled={disableSubmit && !isSubmitting}
        onCancel={() => navigate('/transport-orders')}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
