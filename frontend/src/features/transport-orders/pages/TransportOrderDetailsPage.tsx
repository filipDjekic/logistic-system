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
import { Controller, useForm } from 'react-hook-form';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { canEditTransportOrder, canManageTransportOrders, canMutateTransportOrderItems, getAllowedTransportOrderStatusTransitions } from '../../../core/permissions/operationGuards';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import RecommendedNextStep from '../../../shared/components/NextStep/RecommendedNextStep';
import { StickyMobileActions } from '../../../shared/components/Mobile';
import { LifecycleTransitionDialog } from '../../../shared/components/Lifecycle';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import { EntityLookupField } from '../../lookup';
import FormTextField from '../../../shared/components/Form/Form';
import FormActions from '../../../shared/components/Form/FormActions';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { invalidateTransportOrderState } from '../../../core/utils/invalidateAppState';
import { transportOrdersApi } from '../api/transportOrdersApi';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import StockMovementsTable from '../../stock-movements/components/StockMovementsTable';
import TasksTable from '../../tasks/components/TasksTable';
import { useTasks } from '../../tasks/hooks/useTasks';
import TransportOrderItemsTable from '../components/TransportOrderItemsTable';
import TransportOrderFormDialog from '../components/TransportOrderFormDialog';
import TransportOrderOverviewTab from '../components/details/TransportOrderOverviewTab';
import TransportOrderLifecycleTab from '../components/details/TransportOrderLifecycleTab';
import { formatWeight, getStatusActionLabel } from '../components/details/transportOrderDetailsUtils';
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



type TransportOrderDetailsTab =
  | 'overview'
  | 'lifecycle'
  | 'items'
  | 'relatedStockMovements'
  | 'tasks'
  | 'commentsAttachments'
  | 'domainEvents'
  | 'changeHistory';

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

  const currentRole = auth.user?.role;
  const canManageOrder = canManageTransportOrders(currentRole);

  const canReadItems =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;


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
  const [activeTab, setActiveTab] = useState<TransportOrderDetailsTab>('overview');
  const [transitionTarget, setTransitionTarget] = useState<TransportOrderStatus | null>(null);

  const transportOrderQuery = useTransportOrder(
    isValidTransportOrderId ? transportOrderId : null,
  );

  const itemsQuery = useQuery({
    queryKey: queryKeys.transportOrders.items(transportOrderId),
    queryFn: () => transportOrdersApi.getItemsByTransportOrderId(transportOrderId),
    enabled: isValidTransportOrderId && canReadItems,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const relatedStockMovementsQuery = useQuery({
    queryKey: queryKeys.stockMovements.list({ transportOrderId, page: 0, size: 20, sort: 'createdAt,desc' }),
    queryFn: () => stockMovementsApi.getAll({ transportOrderId, page: 0, size: 20, sort: 'createdAt,desc' }),
    enabled: isValidTransportOrderId && canReadItems,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const relatedTasksQuery = useTasks(
    isValidTransportOrderId
      ? {
          transportOrderId,
          page: 0,
          size: 20,
          sort: 'dueDate,desc',
        }
      : undefined,
    isValidTransportOrderId && canReadItems,
  );

  const allowedTransitionsQuery = useQuery({
    queryKey: ['transport-orders', transportOrderId, 'status-transitions'],
    queryFn: () => transportOrdersApi.getAllowedStatusTransitions(transportOrderId),
    enabled: isValidTransportOrderId && transportOrderQuery.data != null,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const warehousesQuery = useQuery({
    queryKey: queryKeys.transportOrders.warehouses(),
    queryFn: transportOrdersApi.getWarehouses,
    enabled: canResolveWarehouses,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.transportOrders.vehicles(),
    queryFn: transportOrdersApi.getVehicles,
    enabled: canResolveVehicles,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const employeesQuery = useQuery({
    queryKey: queryKeys.transportOrders.employees(),
    queryFn: transportOrdersApi.getEmployees,
    enabled: canResolveEmployees,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.transportOrders.products(),
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

      await invalidateTransportOrderState(queryClient, transportOrderId);
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

      await invalidateTransportOrderState(queryClient, transportOrderId);
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

      await invalidateTransportOrderState(queryClient, transportOrderId);
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

  useEffect(() => {
    const error = createItemMutation.error ?? updateItemMutation.error;
    if (!error) {
      return;
    }

    applyServerFieldErrors(error, itemForm.setError);
  }, [createItemMutation.error, itemForm, updateItemMutation.error]);

  const transportOrder = transportOrderQuery.data;

  useEffect(() => {
    if (!transportOrder || ['DELIVERED', 'FAILED', 'CANCELLED'].includes(transportOrder.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void transportOrderQuery.refetch();
      void relatedTasksQuery.refetch();
      void relatedStockMovementsQuery.refetch();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [transportOrder, transportOrderQuery, relatedTasksQuery, relatedStockMovementsQuery]);

  const fallbackNextStatuses = transportOrder?.allowedNextStatuses?.length
    ? transportOrder.allowedNextStatuses
    : transportOrder
      ? getAllowedTransportOrderStatusTransitions(currentRole, transportOrder.status)
      : [];
  const nextStatuses = allowedTransitionsQuery.data?.allowedStatuses ?? fallbackNextStatuses;
  const canChangeStatus = transportOrder != null && nextStatuses.length > 0;
  const isEditableItems = canMutateTransportOrderItems(currentRole, transportOrder);
  const isEditableOrder = canEditTransportOrder(currentRole, transportOrder);

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
        details={error.fieldErrors}
        onRetry={() => void transportOrderQuery.refetch()}
      />
    );
  }

  const sourceWarehouse = warehousesById[transportOrder.sourceWarehouseId];
  const destinationWarehouse = warehousesById[transportOrder.destinationWarehouseId];
  const vehicle = vehiclesById[transportOrder.vehicleId];
  const employee = employeesById[transportOrder.assignedEmployeeId];

  const isItemMutationLoading =
    createItemMutation.isPending || updateItemMutation.isPending;

  const transportItemCount = itemsQuery.data?.length ?? 0;
  const transportRecommendedStep = (() => {
    const terminal = ['DELIVERED', 'FAILED', 'CANCELLED'].includes(transportOrder.status);

    if (terminal) {
      return {
        title: 'Review final outcome and audit trail.',
        description: 'This transport order is terminal. Use the timeline, linked stock movements and change history to verify the completed business process.',
        severity: 'success' as const,
        actions: [
          { label: 'Open lifecycle', onClick: () => setActiveTab('lifecycle'), variant: 'outlined' as const },
          { label: 'Open stock movements', onClick: () => setActiveTab('relatedStockMovements'), variant: 'outlined' as const },
        ],
      };
    }

    if (canReadItems && transportItemCount === 0 && transportOrder.status === 'DRAFT') {
      return {
        title: 'Add transport items before moving the order forward.',
        description: 'The order has no products connected to it yet. Add at least one item so warehouse execution, reservation and later stock movement tracing have a clear source.',
        severity: 'warning' as const,
        actions: [{ label: 'Add items', onClick: () => setActiveTab('items') }],
      };
    }

    if (relatedTasksQuery.data && relatedTasksQuery.data.totalElements === 0 && canManageOrder && transportOrder.status !== 'DRAFT') {
      return {
        title: 'Create operational tasks for this order.',
        description: 'The order has moved into the operational lifecycle, but there are no linked tasks yet. Create picking, loading, transport or unloading tasks so execution can be tracked by role.',
        severity: 'warning' as const,
        actions: [{ label: 'Create task', to: `/tasks/create?transportOrderId=${transportOrder.id}` }],
      };
    }

    if (nextStatuses.length > 0 && canChangeStatus) {
      return {
        title: `Continue lifecycle from ${transportOrder.status}.`,
        description: `Available next status: ${nextStatuses.join(', ')}. Use a lifecycle action only when the real operational work for the current stage is complete.`,
        severity: 'info' as const,
        actions: [{ label: 'Open status actions', onClick: () => setActiveTab('overview') }],
      };
    }

    return {
      title: 'Review linked operational context.',
      description: 'No direct action is available for your role or the current state. Review tasks, stock movements and lifecycle history to understand the order context.',
      severity: 'info' as const,
      actions: [
        { label: 'Open tasks', onClick: () => setActiveTab('tasks'), variant: 'outlined' as const },
        { label: 'Open lifecycle', onClick: () => setActiveTab('lifecycle'), variant: 'outlined' as const },
      ],
    };
  })();

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'items', label: 'Items', disabled: !canReadItems },
    { value: 'relatedStockMovements', label: 'Related stock movements', disabled: !canReadItems },
    { value: 'tasks', label: 'Tasks', disabled: !canReadItems },
    { value: 'commentsAttachments', label: 'Comments & attachments' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history', disabled: !canViewHistory },
  ];

  return (
    <EntityDetailsLayout
      overline="Operations"
      title={`Transport Order ${transportOrder.orderNumber}`}
      description={transportOrder.description}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as TransportOrderDetailsTab)}
      actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isEditableOrder ? (
              <Button
                variant="contained"
                onClick={() => setOrderDialogOpen(true)}
              >
                Edit order
              </Button>
            ) : null}

            {canManageOrder ? (
              <Button
                variant="contained"
                onClick={() => navigate('/tasks?create=1')}
              >
                Create task
              </Button>
            ) : null}

            {canViewHistory ? (
              <Button
                variant="outlined"
                onClick={() => setActiveTab('changeHistory')}
              >
                View history
              </Button>
            ) : null}

            <Button variant="outlined" onClick={() => navigate('/transport-orders')}>
              Back to list
            </Button>
          </Stack>
      }
    >
      <RecommendedNextStep {...transportRecommendedStep} />

      {activeTab === 'overview' ? (
        <TransportOrderOverviewTab
          transportOrder={transportOrder}
          sourceWarehouse={sourceWarehouse}
          destinationWarehouse={destinationWarehouse}
          vehicle={vehicle}
          employee={employee}
          canChangeStatus={canChangeStatus}
          nextStatuses={nextStatuses}
          statusMutationPending={updateStatusMutation.isPending}
          isEditableOrder={isEditableOrder}
          isEditableItems={isEditableItems}
          onSelectTransition={setTransitionTarget}
        />
      ) : null}


      {activeTab === 'lifecycle' ? (
        <TransportOrderLifecycleTab
          transportOrder={transportOrder}
          nextStatuses={nextStatuses}
        />
      ) : null}

      {activeTab === 'items' ? (
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
                  <Controller
                    name="productId"
                    control={itemForm.control}
                    render={({ field, fieldState }) => {
                      const selectedProduct = productsById[Number(field.value)];
                      const disabledProductIds = (itemsQuery.data ?? [])
                        .filter((item) => !selectedItem || item.id !== selectedItem.id)
                        .map((item) => item.productId);

                      return (
                        <EntityLookupField
                          label="Product"
                          entityType="products"
                          value={field.value ? {
                            id: Number(field.value),
                            label: selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : `Product #${field.value}`,
                            subtitle: selectedProduct ? `${selectedProduct.unit} · ${formatWeight(selectedProduct.weight)}` : null,
                          } : null}
                          onChange={(option) => field.onChange(option?.id ?? 0)}
                          required
                          error={Boolean(fieldState.error)}
                          helperText={fieldState.error?.message ?? 'Products are dynamic records, so use lookup instead of a fixed dropdown.'}
                          searchPlaceholder="Search products by name or SKU..."
                          disabledOptionIds={disabledProductIds}
                        />
                      );
                    }}
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
                  <Stack spacing={1.5}>
                    <FormGlobalError error={createItemMutation.error ?? updateItemMutation.error} />
                    <FormActions
                      cancelLabel={selectedItem ? 'Cancel edit' : 'Clear item form'}
                      submitLabel={selectedItem ? 'Save item changes' : 'Add item'}
                      submittingLabel={selectedItem ? 'Saving item...' : 'Adding item...'}
                      helperText="Product and quantity must be valid before saving transport item."
                      loading={isItemMutationLoading}
                      submitDisabled={!itemForm.formState.isValid}
                      onCancel={() => {
                        setSelectedItem(null);
                        itemForm.reset(itemDefaultValues);
                      }}
                      onSubmit={itemForm.handleSubmit((values) => {
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
                    />
                  </Stack>
                </Grid>
              </Grid>
            </SectionCard>
          ) : null}
        </Stack>
      </SectionCard>
      ) : null}

      {activeTab === 'relatedStockMovements' ? (
        <RelatedDataSection
          title="Related stock movements"
          description="Inventory movements generated from or linked to this transport order."
          loading={relatedStockMovementsQuery.isLoading}
          error={relatedStockMovementsQuery.isError}
          onRetry={() => { void relatedStockMovementsQuery.refetch(); }}
          empty={!relatedStockMovementsQuery.isLoading && !relatedStockMovementsQuery.isError && (relatedStockMovementsQuery.data?.content ?? []).length === 0}
          emptyTitle="No related stock movements"
          emptyDescription="No stock movement is currently linked with this transport order."
        >
          <StockMovementsTable
            rows={relatedStockMovementsQuery.data?.content ?? []}
            loading={relatedStockMovementsQuery.isLoading}
            error={relatedStockMovementsQuery.isError}
            onRetry={() => { void relatedStockMovementsQuery.refetch(); }}
          />
        </RelatedDataSection>
      ) : null}

      {activeTab === 'tasks' ? (
        <RelatedDataSection
          title="Related tasks"
          description="Operational tasks assigned for this transport order."
          loading={relatedTasksQuery.isLoading}
          error={relatedTasksQuery.isError}
          onRetry={() => { void relatedTasksQuery.refetch(); }}
          empty={!relatedTasksQuery.isLoading && !relatedTasksQuery.isError && (relatedTasksQuery.data?.content ?? []).length === 0}
          emptyTitle="No related tasks"
          emptyDescription="No task is currently linked with this transport order."
        >
          <TasksTable
            rows={relatedTasksQuery.data?.content ?? []}
            loading={relatedTasksQuery.isLoading}
            error={relatedTasksQuery.isError}
            onRetry={() => { void relatedTasksQuery.refetch(); }}
            role={currentRole}
            canMutate={false}
            onEdit={() => undefined}
            onDelete={() => undefined}
            showLinks
          />
        </RelatedDataSection>
      ) : null}

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <CommentsPanel entityType="TRANSPORT_ORDER" entityId={transportOrder.id} allowCreate={canManageOrder} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AttachmentsPanel entityType="TRANSPORT_ORDER" entityId={transportOrder.id} allowCreate={canManageOrder} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'domainEvents' ? (
        <DomainEventsPanel entityType="TRANSPORT_ORDER" entityId={transportOrder.id} />
      ) : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel
          entityName="TRANSPORT_ORDER"
          entityId={transportOrder.id}
          title="Transport order change history"
          description="Audit trail for status, item and assignment changes made to this transport order."
        />
      ) : null}


      <StickyMobileActions
        title="Transport quick actions"
        description="Use on phone/tablet while moving the order through execution."
        actions={[
          ...nextStatuses.slice(0, 2).map((status) => ({
            label: getStatusActionLabel(status),
            onClick: () => setTransitionTarget(status),
            disabled: updateStatusMutation.isPending,
          })),
          { label: 'Back', to: '/transport-orders', variant: 'outlined' as const },
        ]}
      />

      <LifecycleTransitionDialog
        open={transitionTarget != null}
        entityLabel={`transport order ${transportOrder.orderNumber}`}
        fromStatus={transportOrder.status}
        toStatus={transitionTarget}
        optimisticVersion={transportOrder.version}
        loading={updateStatusMutation.isPending}
        onClose={() => setTransitionTarget(null)}
        onConfirm={(reason) => {
          if (!transitionTarget) return;
          updateStatusMutation.mutate(
            { id: transportOrder.id, status: transitionTarget, reason, expectedVersion: transportOrder.version },
            { onSettled: () => setTransitionTarget(null) },
          );
        }}
      />

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
        serverError={updateTransportOrderMutation.error}
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
    </EntityDetailsLayout>
  );
}