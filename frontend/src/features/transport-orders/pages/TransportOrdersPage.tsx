import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import StatusOverview from '../../../shared/components/StatusOverview/StatusOverview';
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { transportOrdersApi } from '../api/transportOrdersApi';
import TransportOrderFormDialog from '../components/TransportOrderFormDialog';
import TransportOrdersTable from '../components/TransportOrdersTable';
import { useCreateTransportOrder } from '../hooks/useCreateTransportOrder';
import { useTransportOrders } from '../hooks/useTransportOrders';
import { useUpdateTransportOrder } from '../hooks/useUpdateTransportOrder';
import { useUpdateTransportOrderStatus } from '../hooks/useUpdateTransportOrderStatus';
import type { SortState } from '../../../shared/types/common.types';
import type {
  EmployeeOption,
  TransportOrderFiltersState,
  TransportOrderResponse,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';
import { transportOrderPriorityOptions } from '../validation/transportOrderSchema';

const statusOptions = ['ALL', 'CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const;

export default function TransportOrdersPage() {
  const auth = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.DISPATCHER;
  const canReadAll = canManage || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.WAREHOUSE_MANAGER || auth.user?.role === ROLES.DRIVER;

  const canResolveWarehouses = auth.user?.role !== ROLES.DRIVER;
  const canResolveVehicles =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;
  const canResolveEmployees = canManage;
  const canChangeStatus = canManage || auth.user?.role === ROLES.DRIVER;

  const [filters, setFilters] = useState<TransportOrderFiltersState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
  });


  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TransportOrderResponse | null>(null);

  const transportOrdersQuery = useTransportOrders({ ...filters, page, size, sort: buildSortParam(sort) }, true);
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

  const createTransportOrderMutation = useCreateTransportOrder();
  const updateTransportOrderMutation = useUpdateTransportOrder();
  const updateTransportOrderStatusMutation = useUpdateTransportOrderStatus();

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

  const rows = transportOrdersQuery.data?.content ?? [];

  const statusOverviewItems = useMemo(
    () => statusOptions
      .filter((status) => status !== 'ALL')
      .map((status) => ({
        value: status,
        count: rows.filter((row) => row.status === status).length,
      })),
    [rows],
  );

  const isLookupsLoading =
    (canResolveWarehouses && warehousesQuery.isLoading) ||
    (canResolveVehicles && vehiclesQuery.isLoading) ||
    (canResolveEmployees && employeesQuery.isLoading);

  const isDialogLoading =
    createTransportOrderMutation.isPending || updateTransportOrderMutation.isPending;

  const availableVehiclesCount = (vehiclesQuery.data ?? []).filter((vehicle) => vehicle.status === 'AVAILABLE').length;
  const setupItems = [
    {
      title: 'Create at least one warehouse',
      description: 'Transport orders need source and destination warehouse data.',
      done: !canManage || isLookupsLoading || (warehousesQuery.data ?? []).length > 0,
      action: { label: 'Open warehouses', to: '/warehouses' },
    },
    {
      title: 'Create an available vehicle',
      description: 'Dispatcher cannot assign a transport order without an available vehicle.',
      done: !canManage || isLookupsLoading || availableVehiclesCount > 0,
      action: { label: 'Open vehicles', to: '/vehicles' },
    },
    {
      title: 'Create an employee with DRIVER position',
      description: 'Transport assignment requires at least one driver employee.',
      done: !canManage || isLookupsLoading || (employeesQuery.data ?? []).length > 0,
      action: { label: 'Open employees', to: '/employees' },
    },
  ];

  const hasSetupBlockers = setupItems.some((item) => !item.done);

  useEffect(() => {
    if (searchParams.get('create') !== '1' || !canManage || isLookupsLoading || hasSetupBlockers || dialogOpen) {
      return;
    }

    setSelectedOrder(null);
    setDialogOpen(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
  }, [canManage, dialogOpen, hasSetupBlockers, isLookupsLoading, searchParams, setSearchParams]);

  useEffect(() => {
    setPage(0);
  }, [filters.search, filters.status, filters.priority]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title="Transport Orders"
        description="Dispatcher manages transport planning, driver assignment, vehicle assignment, and company transport visibility."
        actions={
          canManage ? (
            <Button
              variant="contained"
              disabled={hasSetupBlockers}
              onClick={() => {
                setSelectedOrder(null);
                setDialogOpen(true);
              }}
            >
              Create transport order
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Transport order list"
        description="Search and filter transport orders using confirmed backend data."
      >
        <Stack spacing={2}>
          {canManage && !isLookupsLoading ? (
            <SetupGuide
              title="Transport setup is incomplete"
              description="Create the required operational data before opening a new transport order."
              items={setupItems}
            />
          ) : null}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
              placeholder="Search orders, route, vehicle, or driver..."
            />

            <TextField select size="small" label="Status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TransportOrderFiltersState['status'] }))} sx={{ minWidth: 180 }}>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>

            <TextField select size="small" label="Priority" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value as TransportOrderFiltersState['priority'] }))} sx={{ minWidth: 180 }}>
              <MenuItem value="ALL">ALL</MenuItem>
              {transportOrderPriorityOptions.map((priority) => (
                <MenuItem key={priority} value={priority}>{priority}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <StatusOverview items={statusOverviewItems} />

          <TransportOrdersTable
            rows={canReadAll ? rows : []}
            warehousesById={warehousesById}
            vehiclesById={vehiclesById}
            employeesById={employeesById}
            loading={transportOrdersQuery.isLoading || isLookupsLoading}
            error={
              transportOrdersQuery.isError ||
              (canResolveWarehouses && warehousesQuery.isError) ||
              (canResolveVehicles && vehiclesQuery.isError) ||
              (canResolveEmployees && employeesQuery.isError)
            }
            onRetry={() => {
              void transportOrdersQuery.refetch();

              if (canResolveWarehouses) {
                void warehousesQuery.refetch();
              }

              if (canResolveVehicles) {
                void vehiclesQuery.refetch();
              }

              if (canResolveEmployees) {
                void employeesQuery.refetch();
              }
            }}
            canManage={canManage}
            pagination={
              <ServerTablePagination
                page={transportOrdersQuery.data}
                disabled={transportOrdersQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
            sort={sort}
            onSortChange={handleSortChange}
            canChangeStatus={canChangeStatus}
            updatingStatusId={updateTransportOrderStatusMutation.isPending ? updateTransportOrderStatusMutation.variables?.id ?? null : null}
            onStatusChange={(order, status) => {
              if (order.status === status) {
                return;
              }

              updateTransportOrderStatusMutation.mutate({ id: order.id, status });
            }}
            onEdit={(order) => {
              setSelectedOrder(order);
              setDialogOpen(true);
            }}
          />
        </Stack>
      </SectionCard>

      {canManage ? (
        <TransportOrderFormDialog
          open={dialogOpen}
          warehouses={canResolveWarehouses ? warehousesQuery.data ?? [] : []}
          vehicles={canResolveVehicles ? vehiclesQuery.data ?? [] : []}
          employees={canResolveEmployees ? employeesQuery.data ?? [] : []}
          initialData={selectedOrder}
          loading={isDialogLoading}
          onClose={() => {
            setDialogOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={(values) => {
            const payload = {
              orderNumber: values.orderNumber,
              description: values.description,
              orderDate: values.orderDate,
              departureTime: values.departureTime,
              plannedArrivalTime: values.plannedArrivalTime,
              priority: values.priority,
              notes: values.notes || undefined,
              sourceWarehouseId: Number(values.sourceWarehouseId),
              destinationWarehouseId: Number(values.destinationWarehouseId),
              vehicleId: Number(values.vehicleId),
              assignedEmployeeId: Number(values.assignedEmployeeId),
            };

            if (selectedOrder) {
              updateTransportOrderMutation.mutate(
                {
                  id: selectedOrder.id,
                  payload,
                },
                {
                  onSuccess: () => {
                    setDialogOpen(false);
                    setSelectedOrder(null);
                  },
                },
              );
              return;
            }

            createTransportOrderMutation.mutate(payload, {
              onSuccess: () => {
                setDialogOpen(false);
              },
            });
          }}
        />
      ) : null}
    </Stack>
  );
}
