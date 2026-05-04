import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, MenuItem, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { canCreateTasks, canListManagedTasks, canMutateManagedTask, canChangeTaskStatus } from '../../../core/permissions/operationGuards';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import StatusOverview from '../../../shared/components/StatusOverview/StatusOverview';
import SetupGuide from '../../../shared/components/SetupGuide/SetupGuide';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import TasksTable from '../components/TasksTable';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useMyTasks } from '../hooks/useMyTasks';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTaskStatus } from '../hooks/useUpdateTaskStatus';
import type { SortState } from '../../../shared/types/common.types';
import type { TaskFiltersState, TaskQueryParams, TaskResponse } from '../types/task.types';

export default function TasksPage() {
  const auth = useAuthStore();
  const { showSnackbar } = useAppSnackbar();
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
    currentRole === ROLES.DRIVER ||
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

    return params;
  }, [canListManaged, filters]);

  const myTaskQueryParams = useMemo(() => {
    const params = { ...taskQueryParams };
    delete params.assignedEmployeeId;
    return params;
  }, [taskQueryParams]);

  const managedTasksQuery = useTasks({ ...taskQueryParams, page, size, sort: buildSortParam(sort) }, canListManaged);
  const myTasksQuery = useMyTasks({ ...myTaskQueryParams, page, size, sort: buildSortParam(sort) }, !canListManaged);
  const tasksQuery = canListManaged ? managedTasksQuery : myTasksQuery;

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
  const deleteTask = useDeleteTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const [deleteTarget, setDeleteTarget] = useState<TaskResponse | null>(null);

  const assignableEmployees = useMemo(
    () =>
      (employeesQuery.data ?? []).filter(
        (employee) =>
          !isWarehouseManager ||
          employee.position === 'WAREHOUSE_MANAGER' ||
          employee.position === 'WORKER',
      ),
    [employeesQuery.data, isWarehouseManager],
  );

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
      title: 'Create at least one assignable employee',
      description: 'Every task must have a responsible employee.',
      done: !canCreateOrAssign || taskSetupLoading || assignableEmployees.length > 0,
      action: { label: 'Open employees', to: '/employees' },
    },
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

  const hasRequiredTaskSetupBlockers = setupItems.some((item) => !item.done && item.title === 'Create at least one assignable employee');

  useEffect(() => {
    if (searchParams.get('create') !== '1' || !canCreateOrAssign || taskSetupLoading || hasRequiredTaskSetupBlockers) {
      return;
    }
    navigate('/tasks/create');

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
  }, [canCreateOrAssign, hasRequiredTaskSetupBlockers, navigate, searchParams, setSearchParams, taskSetupLoading]);

  useEffect(() => {
    setPage(0);
  }, [filters.search, filters.status, filters.priority, filters.assignedEmployeeId, filters.linkedProcessType]);

  const statusOverviewItems = useMemo(
    () => ['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => ({
      value: status,
      count: rows.filter((row) => row.status === status).length,
    })),
    [rows],
  );

  const refreshAll = () => {
    void Promise.all([
      tasksQuery.refetch(),
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
    filters.linkedProcessType !== 'ALL';

  const clearFilters = () => {
    setPage(0);
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
              disabled={hasRequiredTaskSetupBlockers}
              onClick={() => navigate('/tasks/create')}
            >
              Create task
            </Button>
          ) : null
        }
      />

      <TableLayout
        title="Task list"
        description="Tasks are loaded from the real backend task endpoints and remain scoped by backend company access."
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
                <MenuItem value="NEW">NEW</MenuItem>
                <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
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
                <TextField
                  select
                  size="small"
                  label="Assigned employee"
                  value={filters.assignedEmployeeId}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      assignedEmployeeId:
                        event.target.value === 'ALL' ? 'ALL' : Number(event.target.value),
                    }))
                  }
                  sx={{ minWidth: { xs: '100%', md: 220 } }}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  {assignableEmployees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </MenuItem>
                  ))}
                </TextField>
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
        summary={<StatusOverview items={statusOverviewItems} />}
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
            onDelete={(row) => {
              if (!canMutateManagedTask(currentRole, row)) {
                return;
              }
              setDeleteTarget(row);
            }}
            canChangeStatus={canExecuteTaskStatus}
            updatingStatusId={updateTaskStatus.isPending ? updateTaskStatus.variables?.id ?? null : null}
            onStatusChange={(row, status) => {
              if (row.status === status || !canChangeTaskStatus(currentRole, row)) {
                return;
              }

              updateTaskStatus.mutate({ id: row.id, status });
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete task"
        description={`Delete task "${deleteTarget?.title ?? ''}"?`}
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteTask.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteTask.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (error) => {
              showSnackbar({
                message: getErrorMessage(error),
                severity: 'error',
              });
            },
          });
        }}
      />
    </>
  );
}