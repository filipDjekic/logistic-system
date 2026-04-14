import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { transportOrdersApi } from '../../transport-orders/api/transportOrdersApi';
import TaskFormDialog from '../components/TaskFormDialog';
import TasksTable from '../components/TasksTable';
import { useCreateTask } from '../hooks/useCreateTask';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useMyTasks } from '../hooks/useMyTasks';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type {
  TaskFiltersState,
  TaskFormValues,
  TaskLinkedProcessType,
  TaskResponse,
} from '../types/task.types';

function resolveLinkedProcessType(task: TaskResponse): TaskLinkedProcessType {
  if (task.transportOrderId != null) {
    return 'TRANSPORT_ORDER';
  }

  if (task.stockMovementId != null) {
    return 'STOCK_MOVEMENT';
  }

  return 'UNLINKED';
}

export default function TasksPage() {
  const auth = useAuthStore();
  const { showSnackbar } = useAppSnackbar();

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN ||
    auth.user?.role === ROLES.DISPATCHER ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const managedTasksQuery = useTasks(canManage);
  const myTasksQuery = useMyTasks(!canManage);
  const tasksQuery = canManage ? managedTasksQuery : myTasksQuery;

  const employeesQuery = useQuery({
    queryKey: ['tasks', 'employees'],
    queryFn: transportOrdersApi.getEmployees,
    enabled: canManage,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const transportOrdersQuery = useQuery({
    queryKey: ['tasks', 'transport-orders'],
    queryFn: transportOrdersApi.getAll,
    enabled: canManage,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const stockMovementsQuery = useQuery({
    queryKey: ['tasks', 'stock-movements'],
    queryFn: stockMovementsApi.getAll,
    enabled: canManage,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [filters, setFilters] = useState<TaskFiltersState>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    assignedEmployeeId: 'ALL',
    linkedProcessType: 'ALL',
  });

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TaskResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskResponse | null>(null);

  const employeesById = useMemo(
    () =>
      (employeesQuery.data ?? []).reduce<Record<number, string>>((acc, employee) => {
        acc[employee.id] = `${employee.firstName} ${employee.lastName}`;
        return acc;
      }, {}),
    [employeesQuery.data],
  );

  const transportOrdersById = useMemo(
    () =>
      (transportOrdersQuery.data ?? []).reduce<Record<number, string>>((acc, order) => {
        acc[order.id] = order.orderNumber;
        return acc;
      }, {}),
    [transportOrdersQuery.data],
  );

  const stockMovementsById = useMemo(
    () =>
      (stockMovementsQuery.data ?? []).reduce<Record<number, string>>((acc, movement) => {
        acc[movement.id] = `${movement.movementType} #${movement.id}`;
        return acc;
      }, {}),
    [stockMovementsQuery.data],
  );

  const rows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (tasksQuery.data ?? []).filter((task) => {
      const linkedProcessType = resolveLinkedProcessType(task);
      const assignedEmployeeName = employeesById[task.assignedEmployeeId] ?? '';
      const transportOrderLabel =
        task.transportOrderId != null
          ? transportOrdersById[task.transportOrderId] ?? `#${task.transportOrderId}`
          : '';
      const stockMovementLabel =
        task.stockMovementId != null
          ? stockMovementsById[task.stockMovementId] ?? `#${task.stockMovementId}`
          : '';

      const matchesSearch =
        search.length === 0 ||
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        assignedEmployeeName.toLowerCase().includes(search) ||
        transportOrderLabel.toLowerCase().includes(search) ||
        stockMovementLabel.toLowerCase().includes(search) ||
        String(task.id).includes(search);

      const matchesStatus = filters.status === 'ALL' || task.status === filters.status;
      const matchesPriority = filters.priority === 'ALL' || task.priority === filters.priority;
      const matchesAssignedEmployee =
        filters.assignedEmployeeId === 'ALL' ||
        task.assignedEmployeeId === filters.assignedEmployeeId;
      const matchesLinkedProcessType =
        filters.linkedProcessType === 'ALL' ||
        linkedProcessType === filters.linkedProcessType;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignedEmployee &&
        matchesLinkedProcessType
      );
    });
  }, [
    employeesById,
    filters,
    stockMovementsById,
    tasksQuery.data,
    transportOrdersById,
  ]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title="Tasks"
        description="Manage operational tasks and review automatically created transport and stock movement tasks."
        actions={
          canManage ? (
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

            {canManage ? (
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
                {(employeesQuery.data ?? []).map((employee) => (
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
                  linkedProcessType: event.target.value as TaskFiltersState['linkedProcessType'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="TRANSPORT_ORDER">Transport order</MenuItem>
              <MenuItem value="STOCK_MOVEMENT">Stock movement</MenuItem>
              <MenuItem value="UNLINKED">Unlinked</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void tasksQuery.refetch();

                if (canManage) {
                  void Promise.all([
                    employeesQuery.refetch(),
                    transportOrdersQuery.refetch(),
                    stockMovementsQuery.refetch(),
                  ]);
                }
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
              (canManage &&
                (employeesQuery.isLoading ||
                  transportOrdersQuery.isLoading ||
                  stockMovementsQuery.isLoading))
            }
            error={
              tasksQuery.isError ||
              (canManage &&
                (employeesQuery.isError ||
                  transportOrdersQuery.isError ||
                  stockMovementsQuery.isError))
            }
            onRetry={() => {
              void tasksQuery.refetch();

              if (canManage) {
                void Promise.all([
                  employeesQuery.refetch(),
                  transportOrdersQuery.refetch(),
                  stockMovementsQuery.refetch(),
                ]);
              }
            }}
            canManage={canManage}
            onEdit={(row) => {
              setSelected(row);
              setOpen(true);
            }}
            onDelete={(row) => setDeleteTarget(row)}
          />
        </Stack>
      </SectionCard>

      {canManage ? (
        <TaskFormDialog
          open={open}
          initialData={selected}
          employees={employeesQuery.data ?? []}
          transportOrders={transportOrdersQuery.data ?? []}
          stockMovements={stockMovementsQuery.data ?? []}
          loading={createTask.isPending || updateTask.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(values: TaskFormValues) => {
            const payload = {
              title: values.title,
              description: values.description,
              dueDate: values.dueDate,
              priority: values.priority,
              assignedEmployeeId: Number(values.assignedEmployeeId),
              transportOrderId: values.transportOrderId === '' ? null : Number(values.transportOrderId),
              stockMovementId: values.stockMovementId === '' ? null : Number(values.stockMovementId),
            };

            if (selected) {
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

            createTask.mutate(payload, {
              onSuccess: () => {
                setOpen(false);
              },
            });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete task"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"?` : ''}
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