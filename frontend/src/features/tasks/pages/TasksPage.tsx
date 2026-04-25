import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import TaskFormDialog from '../components/TaskFormDialog';
import TasksTable from '../components/TasksTable';
import { useCreateTask } from '../hooks/useCreateTask';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useMyTasks } from '../hooks/useMyTasks';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { SortState } from '../../../shared/types/common.types';
import type { TaskFiltersState, TaskFormValues, TaskQueryParams, TaskResponse } from '../types/task.types';

export default function TasksPage() {
  const auth = useAuthStore();
  const { showSnackbar } = useAppSnackbar();

  const canListManaged =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const canMutateManaged =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.DISPATCHER;

  const canCreateOrAssign =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER;

  const isWarehouseManager = auth.user?.role === ROLES.WAREHOUSE_MANAGER;

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
    queryKey: ['tasks', 'employees'],
    queryFn: transportOrdersApi.getEmployees,
    enabled: canCreateOrAssign,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useQuery({
    queryKey: ['tasks', 'transport-orders'],
    queryFn: () => transportOrdersApi.getAll({ size: 1000, sort: 'createdAt,desc' }),
    enabled: canCreateOrAssign && !isWarehouseManager,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const stockMovementsQuery = useQuery({
    queryKey: ['tasks', 'stock-movements'],
    queryFn: () => stockMovementsApi.getAll({ size: 1000, sort: 'createdAt,desc' }),
    enabled: canCreateOrAssign,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TaskResponse | null>(null);
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

  return (
    <Stack spacing={3}>
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
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Create task
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Task list"
        description="Tasks are loaded from the real backend task endpoints and remain scoped by backend company access."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by title, description, employee or linked process"
              fullWidth
            />

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

            <Button
              variant="outlined"
              onClick={() => {
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
              }}
              disabled={
                tasksQuery.isFetching ||
                employeesQuery.isFetching ||
                transportOrdersQuery.isFetching ||
                stockMovementsQuery.isFetching
              }
            >
              Refresh
            </Button>
          </Stack>

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
            onRetry={() => {
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
            }}
            canMutate={canMutateManaged}
            onEdit={(row) => {
              if (!canMutateManaged || (isWarehouseManager && row.transportOrderId != null)) {
                return;
              }
              setSelected(row);
              setOpen(true);
            }}
            onDelete={(row) => {
              if (!canMutateManaged || (isWarehouseManager && row.transportOrderId != null)) {
                return;
              }
              setDeleteTarget(row);
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
        </Stack>
      </SectionCard>

      {canCreateOrAssign ? (
        <TaskFormDialog
          open={open}
          initialData={canMutateManaged ? selected : null}
          employees={assignableEmployees}
          transportOrders={isWarehouseManager ? [] : transportOrdersQuery.data?.content ?? []}
          stockMovements={stockMovementsQuery.data?.content ?? []}
          loading={createTask.isPending || updateTask.isPending}
          allowTransportOrderLink={!isWarehouseManager}
          onClose={() => {
            setOpen(false);
            setSelected(null);
          }}
          onSubmit={(values: TaskFormValues) => {
            const payload = {
              title: values.title,
              description: values.description.trim() || undefined,
              dueDate: values.dueDate,
              priority: values.priority,
              assignedEmployeeId: Number(values.assignedEmployeeId),
              transportOrderId: isWarehouseManager
                ? null
                : values.transportOrderId === ''
                  ? null
                  : Number(values.transportOrderId),
              stockMovementId:
                values.stockMovementId === '' ? null : Number(values.stockMovementId),
            };

            if (selected && canMutateManaged) {
              updateTask.mutate(
                { id: selected.id, data: payload },
                {
                  onSuccess: () => {
                    setOpen(false);
                    setSelected(null);
                  },
                },
              );
              return;
            }

            createTask.mutate(payload, { onSuccess: () => setOpen(false) });
          }}
        />
      ) : null}

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
    </Stack>
  );
}