import { useEffect, useMemo, useState } from 'react';
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
import TransportOrderFormDialog from '../components/TransportOrderFormDialog';
import { useUpdateTransportOrder } from '../hooks/useUpdateTransportOrder';
import { useTransportOrder } from '../hooks/useTransportOrder';
import { useUpdateTransportOrderStatus } from '../hooks/useUpdateTransportOrderStatus';
import { normalizeApiError } from '../../../core/api/apiError';
import type {
  EmployeeOption,
  ProductOption,
  TransportOrderItemResponse,
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

function getAllowedNextStatuses(
  status: TransportOrderStatus,
  role: string | null | undefined,
): TransportOrderStatus[] {
  if (role === ROLES.DRIVER) {
    switch (status) {
      case 'ASSIGNED':
        return ['IN_TRANSIT'];
      case 'IN_TRANSIT':
        return ['DELIVERED'];
      default:
        return [];
    }
  }

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

function getStatusActionLabel(status: TransportOrderStatus) {
  switch (status) {
    case 'IN_TRANSIT':
      return 'Start transport';
    case 'DELIVERED':
      return 'Complete transport';
    default:
      return `Set status to ${status}`;
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
  const isValidTransportOrderId =
    Number.isInteger(transportOrderId) && transportOrderId > 0;

  const canManageOrder =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.DISPATCHER;

  const canMutateItems =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.DISPATCHER;

  const canReadItems =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;

  const canChangeStatus =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.DISPATCHER ||
    auth.user?.role === ROLES.DRIVER;

  const canViewHistory = auth.user?.role !== ROLES.DRIVER;

  const canResolveWarehouses = auth.user?.role !== ROLES.DRIVER;

  const canResolveVehicles =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;

  const canResolveEmployees =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;

  const canResolveProducts = canReadItems;

  const [selectedItem, setSelectedItem] = useState<TransportOrderItemResponse | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const transportOrderQuery = useTransportOrder(
    isValidTransportOrderId ? transportOrderId : null,
  );

  const itemsQuery = useQuery({
    queryKey: ['transport-order-items', transportOrderId],
    queryFn: () => transportOrdersApi.getItemsByTransportOrderId(transportOrderId),
    enabled: isValidTransportOrderId && canReadItems,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const warehousesQuery = useQuery({
    queryKey: ['transport-orders', 'warehouses'],
    queryFn: transportOrdersApi.getWarehouses,
    enabled: canResolveWarehouses,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['transport-orders', 'vehicles'],
    queryFn: transportOrdersApi.getVehicles,
    enabled: canResolveVehicles,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const employeesQuery = useQuery({
    queryKey: ['transport-orders', 'employees'],
    queryFn: transportOrdersApi.getEmployees,
    enabled: canResolveEmployees,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useQuery({
    queryKey: ['transport-orders', 'products'],
    queryFn: transportOrdersApi.getProducts,
    enabled: canResolveProducts,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const updateStatusMutation = useUpdateTransportOrderStatus();
  const updateTransportOrderMutation = useUpdateTransportOrder();

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

  const updateItemMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        productId: number;
        quantity: number;
        note?: string;
        transportOrderId: number;
      };
    }) => transportOrdersApi.updateItem(id, data),
    onSuccess: async () => {
      showSnackbar({
        message: 'Transport order item updated successfully.',
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

  useEffect(() => {
    if (!selectedItem) {
      itemForm.reset(itemDefaultValues);
      return;
    }

    itemForm.reset({
      productId: selectedItem.productId,
      quantity: selectedItem.quantity,
      note: selectedItem.note ?? '',
    });
  }, [itemForm, selectedItem]);

  const transportOrder = transportOrderQuery.data;
  const nextStatuses = transportOrder ? getAllowedNextStatuses(transportOrder.status, auth.user?.role) : [];
  const isEditableItems = canMutateItems && transportOrder?.status === 'CREATED';
  const isEditableOrder = canManageOrder && transportOrder?.status === 'CREATED';

  if (!isValidTransportOrderId) {
    return (
      <ErrorState
        title="Invalid transport order"
        description="The transport order ID in the route must be a positive integer."
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
    const error = normalizeApiError(
      transportOrderQuery.error,
      'The requested transport order details are not available.',
    );

    return (
      <ErrorState
        title={
          error.status === 403
            ? 'Access denied'
            : error.status === 404
              ? 'Transport order not found'
              : 'Transport order could not be loaded'
        }
        description={error.message}
        onRetry={() => void transportOrderQuery.refetch()}
      />
    );
  }

  const sourceWarehouse = warehousesById[transportOrder.sourceWarehouseId];
  const destinationWarehouse = warehousesById[transportOrder.destinationWarehouseId];
  const vehicle = vehiclesById[transportOrder.vehicleId];
  const employee = employeesById[transportOrder.assignedEmployeeId];

  const selectableProducts = (productsQuery.data ?? []).filter(
    (product) => typeof product.weight === 'number' && product.weight > 0,
  );

  const productOptions = selectableProducts.map((product) => ({
    value: product.id,
    label: `${product.name} (${product.sku})`,
  }));

  const isItemMutationLoading =
    createItemMutation.isPending || updateItemMutation.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title={`Transport Order ${transportOrder.orderNumber}`}
        description={transportOrder.description}
        actions={
          <Stack direction="row" spacing={1}>
            {isEditableOrder ? (
              <Button
                variant="contained"
                onClick={() => setOrderDialogOpen(true)}
              >
                Edit order
              </Button>
            ) : null}

            {canViewHistory ? (
              <Button
                variant="outlined"
                onClick={() => navigate(`/change-history?entityName=TRANSPORT_ORDER&entityId=${transportOrder.id}`)}
              >
                View history
              </Button>
            ) : null}

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
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle #${transportOrder.vehicleId}`}
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
            {!canChangeStatus ? (
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
                    {getStatusActionLabel(status)}
                  </Button>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard
            title="Item rules"
            description="Item create, edit and remove is allowed only while status is CREATED."
          >
            <Typography variant="body2" color="text.secondary">
              Current status: {transportOrder.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order editing enabled: {isEditableOrder ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Item editing enabled: {isEditableItems ? 'Yes' : 'No'}
            </Typography>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Transport order items"
        description="Items are loaded from the transport order item API and filtered by transport order ID."
      >
        <Stack spacing={3}>
          <TransportOrderItemsTable
            rows={itemsQuery.data ?? []}
            productsById={productsById}
            loading={
              (canReadItems && itemsQuery.isLoading) ||
              (canResolveProducts && productsQuery.isLoading)
            }
            error={
              (canReadItems && itemsQuery.isError) ||
              (canResolveProducts && productsQuery.isError)
            }
            onRetry={() => {
              if (canReadItems) {
                void itemsQuery.refetch();
              }

              if (canResolveProducts) {
                void productsQuery.refetch();
              }
            }}
            showActions={isEditableItems}
            deletingItemId={deleteItemMutation.isPending ? deleteItemMutation.variables ?? null : null}
            onEdit={(item) => setSelectedItem(item)}
            onDelete={(item) => deleteItemMutation.mutate(item.id)}
          />

          {isEditableItems ? (
            <SectionCard
              title={selectedItem ? 'Edit item' : 'Add item'}
              description={
                selectedItem
                  ? `Editing item #${selectedItem.id}.`
                  : 'Uses confirmed item create and update DTO fields only.'
              }
            >
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

                {productOptions.length === 0 ? (
                  <EmptyState
                    title="No valid products available"
                    description="Transport order items require products with a defined weight greater than zero."
                  />
                ) : null}

                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    {selectedItem ? (
                      <Button
                        variant="outlined"
                        disabled={isItemMutationLoading}
                        onClick={() => {
                          setSelectedItem(null);
                          itemForm.reset(itemDefaultValues);
                        }}
                      >
                        Cancel edit
                      </Button>
                    ) : null}

                    <Button
                      variant="contained"
                      disabled={isItemMutationLoading || productOptions.length === 0}
                      onClick={itemForm.handleSubmit((values) => {
                        const payload = {
                          productId: values.productId,
                          quantity: values.quantity,
                          note: (values.note ?? '').trim() || undefined,
                          transportOrderId,
                        };

                        if (selectedItem) {
                          updateItemMutation.mutate(
                            {
                              id: selectedItem.id,
                              data: payload,
                            },
                            {
                              onSuccess: () => {
                                setSelectedItem(null);
                                itemForm.reset(itemDefaultValues);
                              },
                            },
                          );
                          return;
                        }

                        createItemMutation.mutate(payload, {
                          onSuccess: () => {
                            itemForm.reset(itemDefaultValues);
                          },
                        });
                      })}
                    >
                      {selectedItem ? 'Save item changes' : 'Add item'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>
          ) : null}
        </Stack>
      </SectionCard>
      <TransportOrderFormDialog
        open={orderDialogOpen}
        initialData={transportOrder}
        warehouses={canResolveWarehouses ? warehousesQuery.data ?? [] : []}
        vehicles={canResolveVehicles ? vehiclesQuery.data ?? [] : []}
        employees={canResolveEmployees ? employeesQuery.data ?? [] : []}
        loading={
          updateTransportOrderMutation.isPending ||
          (canResolveWarehouses && warehousesQuery.isLoading) ||
          (canResolveVehicles && vehiclesQuery.isLoading) ||
          (canResolveEmployees && employeesQuery.isLoading)
        }
        onClose={() => setOrderDialogOpen(false)}
        onSubmit={(values) => {
          updateTransportOrderMutation.mutate(
            {
              id: transportOrder.id,
              payload: {
                orderNumber: values.orderNumber,
                description: values.description,
                orderDate: values.orderDate,
                departureTime: values.departureTime,
                plannedArrivalTime: values.plannedArrivalTime,
                priority: values.priority,
                notes: values.notes?.trim() || undefined,
                sourceWarehouseId: Number(values.sourceWarehouseId),
                destinationWarehouseId: Number(values.destinationWarehouseId),
                vehicleId: Number(values.vehicleId),
                assignedEmployeeId: Number(values.assignedEmployeeId),
              },
            },
            {
              onSuccess: () => {
                setOrderDialogOpen(false);
              },
            },
          );
        }}
      />
    </Stack>
  );
}