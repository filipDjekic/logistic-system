import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import FormSelect from '../../../shared/components/Form/FormSelect';
import FormTextField from '../../../shared/components/Form/Form';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { transportOrdersApi } from '../api/transportOrdersApi';
import TransportOrderItemsTable from '../components/TransportOrderItemsTable';
import TransportOrderStatusChip from '../components/TransportOrderStatusChip';
import { useTransportOrder } from '../hooks/useTransportOrder';
import { useUpdateTransportOrderStatus } from '../hooks/useUpdateTransportOrderStatus';
import type {
  EmployeeOption,
  ProductOption,
  TransportOrderStatus,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';
import {
  transportOrderItemSchema,
  type TransportOrderItemSchemaValues,
} from '../validation/transportOrderSchema';

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatWeight(value: number | null) {
  if (value == null) {
    return '—';
  }

  return `${value} kg`;
}

function getAllowedNextStatuses(status: TransportOrderStatus): TransportOrderStatus[] {
  switch (status) {
    case 'CREATED':
      return ['ASSIGNED', 'CANCELLED'];
    case 'ASSIGNED':
      return ['IN_TRANSIT', 'CANCELLED'];
    case 'IN_TRANSIT':
      return ['DELIVERED'];
    case 'DELIVERED':
    case 'CANCELLED':
    default:
      return [];
  }
}

const itemDefaultValues: TransportOrderItemSchemaValues = {
  productId: 0,
  quantity: 0,
  note: '',
};

export default function TransportOrderDetailsPage() {
  const params = useParams();
  const auth = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const transportOrderId = Number(params.id);

  const canManageOrder =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;

  const transportOrderQuery = useTransportOrder(
    Number.isFinite(transportOrderId) ? transportOrderId : null,
  );

  const itemsQuery = useQuery({
    queryKey: ['transport-order-items', transportOrderId],
    queryFn: () => transportOrdersApi.getItemsByTransportOrderId(transportOrderId),
    enabled: Number.isFinite(transportOrderId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const warehousesQuery = useQuery({
    queryKey: ['transport-orders', 'warehouses'],
    queryFn: transportOrdersApi.getWarehouses,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['transport-orders', 'vehicles'],
    queryFn: transportOrdersApi.getVehicles,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const employeesQuery = useQuery({
    queryKey: ['transport-orders', 'employees'],
    queryFn: transportOrdersApi.getEmployees,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useQuery({
    queryKey: ['transport-orders', 'products'],
    queryFn: transportOrdersApi.getProducts,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const updateStatusMutation = useUpdateTransportOrderStatus();

  const createItemMutation = useMutation({
    mutationFn: transportOrdersApi.createItem,
    onSuccess: async () => {
      showSnackbar({
        message: 'Transport order item created successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transport-order-items', transportOrderId] }),
        queryClient.invalidateQueries({ queryKey: ['transport-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['transport-orders', 'details', transportOrderId] }),
      ]);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => transportOrdersApi.deleteItem(itemId),
    onSuccess: async () => {
      showSnackbar({
        message: 'Transport order item removed successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transport-order-items', transportOrderId] }),
        queryClient.invalidateQueries({ queryKey: ['transport-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['transport-orders', 'details', transportOrderId] }),
      ]);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });

  const warehousesById = useMemo<Record<number, WarehouseOption>>(
    () =>
      (warehousesQuery.data ?? []).reduce<Record<number, WarehouseOption>>((acc, warehouse) => {
        acc[warehouse.id] = warehouse;
        return acc;
      }, {}),
    [warehousesQuery.data],
  );

  const vehiclesById = useMemo<Record<number, VehicleOption>>(
    () =>
      (vehiclesQuery.data ?? []).reduce<Record<number, VehicleOption>>((acc, vehicle) => {
        acc[vehicle.id] = vehicle;
        return acc;
      }, {}),
    [vehiclesQuery.data],
  );

  const employeesById = useMemo<Record<number, EmployeeOption>>(
    () =>
      (employeesQuery.data ?? []).reduce<Record<number, EmployeeOption>>((acc, employee) => {
        acc[employee.id] = employee;
        return acc;
      }, {}),
    [employeesQuery.data],
  );

  const productsById = useMemo<Record<number, ProductOption>>(
    () =>
      (productsQuery.data ?? []).reduce<Record<number, ProductOption>>((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {}),
    [productsQuery.data],
  );

  const itemForm = useForm<TransportOrderItemSchemaValues>({
    resolver: zodResolver(transportOrderItemSchema),
    defaultValues: itemDefaultValues,
  });

  const transportOrder = transportOrderQuery.data;
  const nextStatuses = transportOrder ? getAllowedNextStatuses(transportOrder.status) : [];
  const isEditableItems = canManageOrder && transportOrder?.status === 'CREATED';

  if (!Number.isFinite(transportOrderId)) {
    return (
      <ErrorState
        title="Invalid transport order"
        description="The transport order ID in the route is not valid."
      />
    );
  }

  if (transportOrderQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Operations"
          title="Transport Order Details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/transport-orders')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading transport order details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (transportOrderQuery.isError || !transportOrder) {
    return (
      <ErrorState
        title="Transport order could not be loaded"
        description="The requested transport order details are not available."
        onRetry={() => void transportOrderQuery.refetch()}
      />
    );
  }

  const sourceWarehouse = warehousesById[transportOrder.sourceWarehouseId];
  const destinationWarehouse = warehousesById[transportOrder.destinationWarehouseId];
  const vehicle = vehiclesById[transportOrder.vehicleId];
  const employee = employeesById[transportOrder.assignedEmployeeId];

  const productOptions = (productsQuery.data ?? []).map((product) => ({
    value: product.id,
    label: `${product.name} (${product.sku})`,
  }));

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title={`Transport Order ${transportOrder.orderNumber}`}
        description={transportOrder.description}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/change-history?entityName=TRANSPORT_ORDER&entityId=${transportOrder.id}`)}
            >
              View history
            </Button>
            <Button variant="outlined" onClick={() => navigate('/transport-orders')}>
              Back to list
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Overview" description="Core transport order data confirmed by backend DTOs.">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <TransportOrderStatusChip status={transportOrder.status} />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Priority
                  </Typography>
                  <StatusChip value={transportOrder.priority} />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Source warehouse
                </Typography>
                <Typography variant="body1">
                  {sourceWarehouse?.name ?? `Warehouse #${transportOrder.sourceWarehouseId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sourceWarehouse ? `${sourceWarehouse.address}, ${sourceWarehouse.city}` : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Destination warehouse
                </Typography>
                <Typography variant="body1">
                  {destinationWarehouse?.name ?? `Warehouse #${transportOrder.destinationWarehouseId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {destinationWarehouse
                    ? `${destinationWarehouse.address}, ${destinationWarehouse.city}`
                    : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Vehicle
                </Typography>
                <Typography variant="body1">
                  {vehicle
                    ? `${vehicle.brand} ${vehicle.model}`
                    : `Vehicle #${transportOrder.vehicleId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vehicle ? `${vehicle.registrationNumber} · ${vehicle.status}` : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Driver
                </Typography>
                <Typography variant="body1">
                  {employee
                    ? `${employee.firstName} ${employee.lastName}`
                    : `Employee #${transportOrder.assignedEmployeeId}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {employee?.email ?? '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Order date
                </Typography>
                <Typography variant="body1">{formatDateTime(transportOrder.orderDate)}</Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Departure time
                </Typography>
                <Typography variant="body1">{formatDateTime(transportOrder.departureTime)}</Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Planned arrival
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(transportOrder.plannedArrivalTime)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Actual arrival
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(transportOrder.actualArrivalTime)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Total weight
                </Typography>
                <Typography variant="body1">{formatWeight(transportOrder.totalWeight)}</Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Created by user ID
                </Typography>
                <Typography variant="body1">{transportOrder.createdById}</Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1">{transportOrder.notes?.trim() || '—'}</Typography>
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Status actions" description="Allowed transitions follow backend service rules.">
            {!canManageOrder ? (
              <EmptyState
                title="No status actions available"
                description="Your role can review the order but cannot change its status."
              />
            ) : nextStatuses.length === 0 ? (
              <EmptyState
                title="No more status actions"
                description="This transport order is already in a terminal state."
              />
            ) : (
              <Stack spacing={1.5}>
                {nextStatuses.map((status) => (
                  <Button
                    key={status}
                    variant="contained"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: transportOrder.id,
                        status,
                      })
                    }
                  >
                    Set status to {status}
                  </Button>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard
            title="Item rules"
            description="Item create/remove is allowed only while status is CREATED."
          >
            <Typography variant="body2" color="text.secondary">
              Current status: {transportOrder.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Item editing enabled: {isEditableItems ? 'Yes' : 'No'}
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard title="Transport order items" description="Items are loaded from the transport order item API and filtered by transport order ID.">
        <Stack spacing={3}>
          <TransportOrderItemsTable
            rows={itemsQuery.data ?? []}
            productsById={productsById}
            loading={itemsQuery.isLoading || productsQuery.isLoading}
            error={itemsQuery.isError || productsQuery.isError}
            onRetry={() => {
              void itemsQuery.refetch();
              void productsQuery.refetch();
            }}
            showActions={isEditableItems}
            deletingItemId={deleteItemMutation.isPending ? deleteItemMutation.variables ?? null : null}
            onDelete={(item) => deleteItemMutation.mutate(item.id)}
          />

          {isEditableItems ? (
            <SectionCard title="Add item" description="Uses confirmed item create DTO fields only.">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormSelect
                    name="productId"
                    control={itemForm.control}
                    label="Product"
                    options={productOptions}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    name="quantity"
                    control={itemForm.control}
                    label="Quantity"
                    type="number"
                    required
                    slotProps={{
                      htmlInput: {
                        min: 0.000001,
                        step: 'any',
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    name="note"
                    control={itemForm.control}
                    label="Note"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      variant="contained"
                      disabled={createItemMutation.isPending}
                      onClick={itemForm.handleSubmit((values) => {
                        createItemMutation.mutate(
                          {
                            productId: values.productId,
                            quantity: values.quantity,
                            note: (values.note ?? '').trim() || undefined,
                            transportOrderId,
                          },
                          {
                            onSuccess: () => {
                              itemForm.reset(itemDefaultValues);
                            },
                          },
                        );
                      })}
                    >
                      Add item
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>
          ) : null}
        </Stack>
      </SectionCard>
    </Stack>
  );
}