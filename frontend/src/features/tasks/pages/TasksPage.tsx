import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, MenuItem, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { canCreateTasks, canListManagedTasks, canMutateManagedTask, canChangeTaskStatus } from '../../../core/permissions/operationGuards';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import TasksTable from '../components/TasksTable';
import { useMyTasks } from '../hooks/useMyTasks';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import { tasksApi } from '../api/tasksApi';
import type { SortState } from '../../../shared/types/common.types';
import type { TaskFiltersState, TaskQueryParams } from '../types/task.types';

export default function TasksPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentRole = auth.user?.role;
  const canListManaged = canListManagedTasks(currentRole);
  const canCreateOrAssign = canCreateTasks(currentRole);
  const isWarehouseManager = currentRole === ROLES.WAREHOUSE_MANAGER;
  const canExecuteTaskStatus =
    currentRole === ROLES.OVERLORD ||
    currentRole === ROLES.DISPATCHER ||
    currentRole === ROLES.WAREHOUSE_MANAGER ||
    currentRole === ROLES.WORKER;
  const canShowTaskActions =
    currentRole === ROLES.OVERLORD ||
    currentRole === ROLES.DISPATCHER ||
    currentRole === ROLES.WAREHOUSE_MANAGER;

  const [filters, setFilters] = useState<TaskFiltersState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assignedEmployeeId: 'ALL',
    linkedProcessType: 'ALL',
  });
  const [assignedEmployeeFilter, setAssignedEmployeeFilter] = useState<LookupOption | null>(null);
  const [routeTransportOrderId, setRouteTransportOrderId] = useState<number | null>(null);
  const [routeStockMovementId, setRouteStockMovementId] = useState<number | null>(null);


  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'dueDate', direction: 'asc' });

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };
  const taskQueryParams = useMemo<TaskQueryParams>(() => {
    const params: TaskQueryParams = {};

    if (filters.search.trim().length > 0) {
      params.search = filters.search.trim();
    }

    if (filters.status !== 'ALL') {
      params.status = filters.status;
    }

    if (filters.priority !== 'ALL') {
      params.priority = filters.priority;
    }

    if (filters.assignedEmployeeId !== 'ALL' && canListManaged) {
      params.assignedEmployeeId = filters.assignedEmployeeId;
    }

    if (filters.linkedProcessType !== 'ALL') {
      params.linkedProcessType = filters.linkedProcessType;
    }

    if (routeTransportOrderId != null) {
      params.transportOrderId = routeTransportOrderId;
    }

    if (routeStockMovementId != null) {
      params.stockMovementId = routeStockMovementId;
    }

    return params;
  }, [canListManaged, filters, routeStockMovementId, routeTransportOrderId]);

  const myTaskQueryParams = useMemo(() => {
    const params = { ...taskQueryParams };
    delete params.assignedEmployeeId;
    return params;
  }, [taskQueryParams]);

  const managedTasksQuery = useTasks({ ...taskQueryParams, page, size, sort: buildSortParam(sort) }, canListManaged);
  const myTasksQuery = useMyTasks({ ...myTaskQueryParams, page, size, sort: buildSortParam(sort) }, !canListManaged);
  const tasksQuery = canListManaged ? managedTasksQuery : myTasksQuery;
  const taskStatusCountsQuery = useQuery({
    queryKey: queryKeys.tasks.statusCounts(taskQueryParams),
    queryFn: () => tasksApi.getStatusCounts(taskQueryParams),
    enabled: canListManaged,
    staleTime: 30_000,
  });

  const employeesQuery = useQuery({
    queryKey: queryKeys.tasks.employees(),
    queryFn: transportOrdersApi.getEmployees,
    enabled: canCreateOrAssign,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useQuery({
    queryKey: queryKeys.tasks.transportOrders(),
    queryFn: () => transportOrdersApi.getAll({ size: 25, sort: 'createdAt,desc' }),
    enabled: canCreateOrAssign && !isWarehouseManager,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const stockMovementsQuery = useQuery({
    queryKey: queryKeys.tasks.stockMovements(),
    queryFn: () => stockMovementsApi.getAll({ size: 25, sort: 'createdAt,desc' }),
    enabled: canCreateOrAssign,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const updateTaskStatus = useUpdateTaskStatus();

  const managedRows = useMemo(
    () =>
      (tasksQuery.data?.content ?? []).filter((task) => {
        if (isWarehouseManager && task.transportOrderId != null) {
          return false;
        }

        if (auth.user?.role === ROLES.DRIVER && task.transportOrderId == null) {
          return false;
        }

        return true;
      }),
    [auth.user?.role, isWarehouseManager, tasksQuery.data],
  );

  const rows = managedRows;

  const taskSetupLoading = employeesQuery.isLoading || transportOrdersQuery.isLoading || stockMovementsQuery.isLoading;
  const setupItems = [
    {
      title: 'Create transport orders before transport-linked tasks',
      description: 'Transport task context is available only after transport orders exist.',
      done: !canCreateOrAssign || isWarehouseManager || taskSetupLoading || (transportOrdersQuery.data?.content ?? []).length > 0,
      action: { label: 'Open transport orders', to: '/transport-orders' },
    },
    {
      title: 'Create stock movements before warehouse-linked tasks',
      description: 'Warehouse task context is clearer when a stock movement exists.',
      done: !canCreateOrAssign || taskSetupLoading || (stockMovementsQuery.data?.content ?? []).length > 0,
      action: { label: 'Open stock movements', to: '/stock-movements' },
    },
  ];


  useEffect(() => {
    const status = searchParams.get('status');
    const transportId = searchParams.get('transportId') ?? searchParams.get('transportOrderId');
    const stockMovementId = searchParams.get('stockMovementId');

    setFilters((current) => {
      const nextStatus = status && ['NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'].includes(status)
        ? status as TaskFiltersState['status']
        : current.status;

      if (nextStatus === current.status) {
        return current;
      }

      setPage(0);
      return { ...current, status: nextStatus };
    });

    const nextTransportOrderId = transportId && Number.isFinite(Number(transportId)) ? Number(transportId) : null;
    const nextStockMovementId = stockMovementId && Number.isFinite(Number(stockMovementId)) ? Number(stockMovementId) : null;
    setRouteTransportOrderId((current) => current === nextTransportOrderId ? current : nextTransportOrderId);
    setRouteStockMovementId((current) => current === nextStockMovementId ? current : nextStockMovementId);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('create') !== '1' || !canCreateOrAssign || taskSetupLoading) {
      return;
    }
    navigate('/tasks/create');

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
  }, [canCreateOrAssign, navigate, searchParams, setSearchParams, taskSetupLoading]);

  useEffect(() => {
    setPage(0);
  }, [filters.search, filters.status, filters.priority, filters.assignedEmployeeId, filters.linkedProcessType]);

  const refreshAll = () => {
    void Promise.all([
      tasksQuery.refetch(),
      taskStatusCountsQuery.refetch(),
      ...(canCreateOrAssign
        ? [
            employeesQuery.refetch(),
            transportOrdersQuery.refetch(),
            stockMovementsQuery.refetch(),
          ]
        : []),
    ]);
  };

  const filtersDisabled =
    tasksQuery.isFetching ||
    employeesQuery.isFetching ||
    transportOrdersQuery.isFetching ||
    stockMovementsQuery.isFetching;

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.assignedEmployeeId !== 'ALL' ||
    filters.linkedProcessType !== 'ALL' ||
    routeTransportOrderId != null ||
    routeStockMovementId != null;

  const clearFilters = () => {
    setPage(0);
    setAssignedEmployeeFilter(null);
    setRouteTransportOrderId(null);
    setRouteStockMovementId(null);
    setSearchParams({}, { replace: true });
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      assignedEmployeeId: 'ALL',
      linkedProcessType: 'ALL',
    });
  };

  return (
    <>
      <PageHeader
        overline="Operations"
        title="Tasks"
        description={
          auth.user?.role === ROLES.DRIVER
            ? 'Driver can review only transport-linked tasks assigned to the authenticated driver.'
            : 'Company admin can review all company tasks and create or assign them, but task editing, deletion, and status execution remain operational responsibilities.'
        }
        actions={
          canCreateOrAssign ? (
            <Button
              variant="contained"
              onClick={() => navigate('/tasks/create')}
            >
              Create task
            </Button>
          ) : null
        }
      />

      <TableLayout
        title="Task list"
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by title, description, employee or linked process"
            onRefresh={refreshAll}
            refreshDisabled={filtersDisabled}
            onClearFilters={clearFilters}
            clearDisabled={filtersDisabled || !hasActiveFilters}
          />
        }
        filters={
          <>
            {canCreateOrAssign && !taskSetupLoading ? (
              <SetupGuide
                title="Task setup has missing context"
                description="Create the required assignment data first. Process links are optional, but they make execution clearer."
                items={setupItems}
              />
            ) : null}

            <FilterPanel>
              <TextField
                select
                size="small"
                label="Status"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as TaskFiltersState['status'],
                  }))
                }
                sx={{ minWidth: { xs: '100%', md: 180 } }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="OPEN">OPEN</MenuItem>
                <MenuItem value="ASSIGNED">ASSIGNED</MenuItem>
                <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                <MenuItem value="BLOCKED">BLOCKED</MenuItem>
                <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                <MenuItem value="CANCELLED">CANCELLED</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Priority"
                value={filters.priority}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    priority: event.target.value as TaskFiltersState['priority'],
                  }))
                }
                sx={{ minWidth: { xs: '100%', md: 180 } }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="LOW">LOW</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                <MenuItem value="HIGH">HIGH</MenuItem>
                <MenuItem value="URGENT">URGENT</MenuItem>
              </TextField>

              {canCreateOrAssign ? (
                <EntityLookupField
                  label="Assigned employee"
                  entityType="employees"
                  value={assignedEmployeeFilter}
                  onChange={(option) => {
                    setAssignedEmployeeFilter(option);
                    setFilters((prev) => ({
                      ...prev,
                      assignedEmployeeId: option?.id ?? 'ALL',
                    }));
                  }}
                  placeholder="All"
                  searchPlaceholder="Search employees..."
                />
              ) : null}

              <TextField
                select
                size="small"
                label="Linked process"
                value={filters.linkedProcessType}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    linkedProcessType:
                      event.target.value as TaskFiltersState['linkedProcessType'],
                  }))
                }
                sx={{ minWidth: { xs: '100%', md: 220 } }}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="UNLINKED">UNLINKED</MenuItem>
                <MenuItem value="TRANSPORT_ORDER">TRANSPORT_ORDER</MenuItem>
                <MenuItem value="STOCK_MOVEMENT">STOCK_MOVEMENT</MenuItem>
              </TextField>
            </FilterPanel>
          </>
        }
        table={
          <TasksTable
            rows={rows}
            loading={
              tasksQuery.isLoading ||
              (canCreateOrAssign &&
                (employeesQuery.isLoading ||
                  transportOrdersQuery.isLoading ||
                  stockMovementsQuery.isLoading))
            }
            error={
              tasksQuery.isError ||
              (canCreateOrAssign &&
                (employeesQuery.isError ||
                  transportOrdersQuery.isError ||
                  stockMovementsQuery.isError))
            }
            onRetry={refreshAll}
            role={currentRole}
            canMutate={canShowTaskActions}
            onEdit={(row) => {
              if (!canMutateManagedTask(currentRole, row)) {
                return;
              }
              navigate(`/tasks/${row.id}/edit`);
            }}
            canChangeStatus={canExecuteTaskStatus}
            updatingStatusId={updateTaskStatus.isPending ? updateTaskStatus.variables?.id ?? null : null}
            onStatusChange={(row, status) => {
              if (row.status === status || !canChangeTaskStatus(currentRole, row)) {
                return;
              }

              updateTaskStatus.mutate({ id: row.id, status, expectedVersion: row.version });
            }}
            pagination={
              <ServerTablePagination
                page={tasksQuery.data}
                disabled={tasksQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
            sort={sort}
            onSortChange={handleSortChange}
          />
        }
      />

    </>
  );
}