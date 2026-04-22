import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { transportOrdersApi } from '../api/transportOrdersApi';
import TransportOrderFormDialog from '../components/TransportOrderFormDialog';
import TransportOrdersTable from '../components/TransportOrdersTable';
import { useCreateTransportOrder } from '../hooks/useCreateTransportOrder';
import { useTransportOrders } from '../hooks/useTransportOrders';
import { useUpdateTransportOrder } from '../hooks/useUpdateTransportOrder';
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

  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.DISPATCHER;
  const canReadAll = canManage || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.WAREHOUSE_MANAGER || auth.user?.role === ROLES.DRIVER;

  const canResolveWarehouses = auth.user?.role !== ROLES.DRIVER;
  const canResolveVehicles =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;
  const canResolveEmployees = canManage;

  const [filters, setFilters] = useState<TransportOrderFiltersState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TransportOrderResponse | null>(null);

  const transportOrdersQuery = useTransportOrders(true);
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

  const filteredRows = useMemo<TransportOrderResponse[]>(() => {
    const rows = transportOrdersQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus = filters.status === 'ALL' || row.status === filters.status;
      const matchesPriority = filters.priority === 'ALL' || row.priority === filters.priority;

      if (!matchesStatus || !matchesPriority) {
        return false;
      }

      if (!search) {
        return true;
      }

      const sourceWarehouse = warehousesById[row.sourceWarehouseId];
      const destinationWarehouse = warehousesById[row.destinationWarehouseId];
      const vehicle = vehiclesById[row.vehicleId];
      const employee = employeesById[row.assignedEmployeeId];

      return [
        row.orderNumber,
        row.description,
        sourceWarehouse?.name,
        sourceWarehouse?.city,
        destinationWarehouse?.name,
        destinationWarehouse?.city,
        vehicle?.registrationNumber,
        vehicle?.brand,
        vehicle?.model,
        employee ? `${employee.firstName} ${employee.lastName}` : '',
        employee?.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [employeesById, filters, transportOrdersQuery.data, vehiclesById, warehousesById]);

  const isLookupsLoading =
    (canResolveWarehouses && warehousesQuery.isLoading) ||
    (canResolveVehicles && vehiclesQuery.isLoading) ||
    (canResolveEmployees && employeesQuery.isLoading);

  const isDialogLoading =
    createTransportOrderMutation.isPending || updateTransportOrderMutation.isPending;

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

          <TransportOrdersTable
            rows={canReadAll ? filteredRows : []}
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
