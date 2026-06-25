import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { canChangeTransportOrderStatus, canEditTransportOrder, canManageTransportOrders } from '../../../core/permissions/operationGuards';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import StatusOverview from '../../../shared/components/StatusOverview/StatusOverview';
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import { transportOrdersApi } from '../api/transportOrdersApi';
import TransportOrdersTable from '../components/TransportOrdersTable';
import { useTransportOrders } from '../hooks/useTransportOrders';
import { useUpdateTransportOrderStatus } from '../hooks/useUpdateTransportOrderStatus';
import type { SortState } from '../../../shared/types/common.types';
import type { EmployeeOption, TransportOrderFiltersState, VehicleOption, WarehouseOption } from '../types/transportOrder.types';
import { transportOrderPriorityOptions } from '../validation/transportOrderSchema';

const statusOptions = ['ALL', 'DRAFT', 'ASSIGNED', 'PICKING', 'PACKING', 'READY_FOR_LOADING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNING', 'RESCHEDULED', 'CANCELLED'] as const;

export default function TransportOrdersPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentRole = auth.user?.role;
  const canManage = canManageTransportOrders(currentRole);
  const canReadAll = canManage || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.WAREHOUSE_MANAGER || auth.user?.role === ROLES.DRIVER || auth.user?.role === ROLES.WORKER;
  const canResolveWarehouses = auth.user?.role !== ROLES.DRIVER;
  const canResolveVehicles = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN || auth.user?.role === ROLES.DISPATCHER || auth.user?.role === ROLES.WAREHOUSE_MANAGER;
  const canResolveEmployees = canManage || auth.user?.role === ROLES.WAREHOUSE_MANAGER;
  const canChangeStatus = canManage || currentRole === ROLES.DRIVER;

  const [filters, setFilters] = useState<TransportOrderFiltersState>({ search: '', status: 'ALL', priority: 'ALL' });
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState<LookupOption | null>(null);
  const [destinationWarehouseFilter, setDestinationWarehouseFilter] = useState<LookupOption | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<LookupOption | null>(null);
  const [driverFilter, setDriverFilter] = useState<LookupOption | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const status = searchParams.get('status');
    if (!statusOptions.includes((status ?? 'ALL') as (typeof statusOptions)[number])) {
      return;
    }
    setFilters((current) => {
      const nextStatus = (status ?? 'ALL') as TransportOrderFiltersState['status'];
      if (current.status === nextStatus) {
        return current;
      }
      setPage(0);
      return { ...current, status: nextStatus };
    });
  }, [searchParams]);

  const transportOrderStatusCountParams = {
    search: filters.search,
    priority: filters.priority,
    sourceWarehouseId: sourceWarehouseFilter?.id ?? null,
    destinationWarehouseId: destinationWarehouseFilter?.id ?? null,
    vehicleId: vehicleFilter?.id ?? null,
    assignedEmployeeId: driverFilter?.id ?? null,
  };
  const transportOrdersQuery = useTransportOrders({
    ...filters,
    sourceWarehouseId: sourceWarehouseFilter?.id ?? null,
    destinationWarehouseId: destinationWarehouseFilter?.id ?? null,
    vehicleId: vehicleFilter?.id ?? null,
    assignedEmployeeId: driverFilter?.id ?? null,
    page,
    size,
    sort: buildSortParam(sort),
  }, true);
  const transportStatusCountsQuery = useQuery({
    queryKey: queryKeys.transportOrders.statusCounts(transportOrderStatusCountParams),
    queryFn: () => transportOrdersApi.getStatusCounts(transportOrderStatusCountParams),
    enabled: canReadAll,
    staleTime: 30_000,
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
  const updateTransportOrderStatusMutation = useUpdateTransportOrderStatus();

  const warehousesById = useMemo<Record<number, WarehouseOption>>(
    () => (warehousesQuery.data ?? []).reduce<Record<number, WarehouseOption>>((acc, warehouse) => {
      acc[warehouse.id] = warehouse;
      return acc;
    }, {}),
    [warehousesQuery.data],
  );
  const vehiclesById = useMemo<Record<number, VehicleOption>>(
    () => (vehiclesQuery.data ?? []).reduce<Record<number, VehicleOption>>((acc, vehicle) => {
      acc[vehicle.id] = vehicle;
      return acc;
    }, {}),
    [vehiclesQuery.data],
  );
  const employeesById = useMemo<Record<number, EmployeeOption>>(
    () => (employeesQuery.data ?? []).reduce<Record<number, EmployeeOption>>((acc, employee) => {
      acc[employee.id] = employee;
      return acc;
    }, {}),
    [employeesQuery.data],
  );

  const rows = transportOrdersQuery.data?.content ?? [];
  const statusOverviewItems = useMemo(
    () => {
      const countsByStatus = new Map((transportStatusCountsQuery.data ?? []).map((item) => [item.status, item.count]));

      return statusOptions
        .filter((status) => status !== 'ALL')
        .map((status) => ({
          value: status,
          count: countsByStatus.get(status) ?? rows.filter((row) => row.status === status).length,
        }));
    },
    [rows, transportStatusCountsQuery.data],
  );
  const isLookupsLoading = (canResolveWarehouses && warehousesQuery.isLoading) || (canResolveVehicles && vehiclesQuery.isLoading) || (canResolveEmployees && employeesQuery.isLoading);
  const availableVehiclesCount = (vehiclesQuery.data ?? []).filter((vehicle) => vehicle.status === 'AVAILABLE').length;
  const setupItems = [
    { title: 'Create at least one warehouse', description: 'Transport orders need source and destination warehouse data.', done: !canManage || isLookupsLoading || (warehousesQuery.data ?? []).length > 0, action: { label: 'Open warehouses', to: '/warehouses' } },
    { title: 'Create an available vehicle', description: 'Dispatcher cannot assign a transport order without an available vehicle.', done: !canManage || isLookupsLoading || availableVehiclesCount > 0, action: { label: 'Open vehicles', to: '/vehicles' } },
    { title: 'Create an employee with DRIVER position', description: 'Transport assignment requires at least one driver employee.', done: !canManage || isLookupsLoading || (employeesQuery.data ?? []).length > 0, action: { label: 'Open employees', to: '/employees' } },
  ];
  const hasSetupBlockers = setupItems.some((item) => !item.done);

  useEffect(() => {
    if (searchParams.get('create') !== '1' || !canManage || isLookupsLoading || hasSetupBlockers) return;
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
    navigate('/transport-orders/create');
  }, [canManage, hasSetupBlockers, isLookupsLoading, navigate, searchParams, setSearchParams]);

  useEffect(() => {
    setPage(0);
  }, [filters.search, filters.status, filters.priority]);

  const refreshAll = () => {
    void transportOrdersQuery.refetch();
    if (canResolveWarehouses) void warehousesQuery.refetch();
    if (canResolveVehicles) void vehiclesQuery.refetch();
    if (canResolveEmployees) void employeesQuery.refetch();
  };

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    sourceWarehouseFilter !== null ||
    destinationWarehouseFilter !== null ||
    vehicleFilter !== null ||
    driverFilter !== null;

  const clearFilters = () => {
    setPage(0);
    setSourceWarehouseFilter(null);
    setDestinationWarehouseFilter(null);
    setVehicleFilter(null);
    setDriverFilter(null);
    setFilters({ search: '', status: 'ALL', priority: 'ALL' });
  };

  return (
    <>
      <PageHeader
        overline="Operations"
        title="Transport Orders"
        description="Dispatcher manages transport planning, driver assignment, vehicle assignment, and company transport visibility."
        actions={canManage ? <Button variant="contained" disabled={hasSetupBlockers} onClick={() => navigate('/transport-orders/create')}>Create transport order</Button> : null}
      />

      <TableLayout
        title="Transport order list"
        description="Search and filter transport orders using confirmed backend data."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => { setPage(0); setFilters((current) => ({ ...current, search: value })); }}
            searchPlaceholder="Search orders, route, vehicle, or driver..."
            onRefresh={refreshAll}
            refreshDisabled={transportOrdersQuery.isFetching || isLookupsLoading}
            onClearFilters={clearFilters}
            clearDisabled={transportOrdersQuery.isFetching || !hasActiveFilters}
          />
        }
        filters={
          <>
            {canManage && !isLookupsLoading ? <SetupGuide title="Transport setup is incomplete" description="Create the required operational data before opening a new transport order." items={setupItems} /> : null}

            <FilterPanel>
              <TextField select size="small" label="Status" value={filters.status} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, status: event.target.value as TransportOrderFiltersState['status'] })); }} sx={{ minWidth: { xs: '100%', md: 180 } }}>
                {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
              <TextField select size="small" label="Priority" value={filters.priority} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, priority: event.target.value as TransportOrderFiltersState['priority'] })); }} sx={{ minWidth: { xs: '100%', md: 180 } }}>
                <MenuItem value="ALL">ALL</MenuItem>
                {transportOrderPriorityOptions.map((priority) => <MenuItem key={priority} value={priority}>{priority}</MenuItem>)}
              </TextField>
              {canResolveWarehouses ? (
                <EntityLookupField label="Source warehouse" entityType="warehouses" value={sourceWarehouseFilter} onChange={(option) => { setPage(0); setSourceWarehouseFilter(option); }} placeholder="All" searchPlaceholder="Search warehouses..." />
              ) : null}
              {canResolveWarehouses ? (
                <EntityLookupField label="Destination warehouse" entityType="warehouses" value={destinationWarehouseFilter} onChange={(option) => { setPage(0); setDestinationWarehouseFilter(option); }} placeholder="All" searchPlaceholder="Search warehouses..." />
              ) : null}
              {canResolveVehicles ? (
                <EntityLookupField label="Vehicle" entityType="vehicles" value={vehicleFilter} onChange={(option) => { setPage(0); setVehicleFilter(option); }} placeholder="All" searchPlaceholder="Search vehicles..." />
              ) : null}
              {canResolveEmployees ? (
                <EntityLookupField label="Driver" entityType="employees" value={driverFilter} onChange={(option) => { setPage(0); setDriverFilter(option); }} placeholder="All" searchPlaceholder="Search drivers..." />
              ) : null}
            </FilterPanel>
          </>
        }
        table={
          <TransportOrdersTable
            rows={canReadAll ? rows : []}
            warehousesById={warehousesById}
            vehiclesById={vehiclesById}
            employeesById={employeesById}
            loading={transportOrdersQuery.isLoading || isLookupsLoading}
            error={transportOrdersQuery.isError || (canResolveWarehouses && warehousesQuery.isError) || (canResolveVehicles && vehiclesQuery.isError) || (canResolveEmployees && employeesQuery.isError)}
            onRetry={refreshAll}
            role={currentRole}
            canManage={canManage}
            pagination={<ServerTablePagination page={transportOrdersQuery.data} disabled={transportOrdersQuery.isFetching} onPageChange={setPage} onSizeChange={(nextSize) => { setPage(0); setSize(nextSize); }} />}
            sort={sort}
            onSortChange={(nextSort) => { setPage(0); setSort(nextSort); }}
            canChangeStatus={canChangeStatus}
            updatingStatusId={updateTransportOrderStatusMutation.isPending ? updateTransportOrderStatusMutation.variables?.id ?? null : null}
            onStatusChange={(order, status) => {
              if (order.status === status || !canChangeTransportOrderStatus(currentRole, order)) return;
              updateTransportOrderStatusMutation.mutate({ id: order.id, status, expectedVersion: order.version });
            }}
            onEdit={(order) => {
              if (!canEditTransportOrder(currentRole, order)) return;
              navigate(`/transport-orders/${order.id}/edit`);
            }}
          />
        }
      />
    </>
  );
}
