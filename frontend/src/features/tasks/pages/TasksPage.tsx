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
import type { TaskFormValues, TaskResponse } from '../types/task.types';

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

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
  });
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TaskResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskResponse | null>(null);

  const rows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return (tasksQuery.data ?? []).filter((task) => {
      const matchesSearch =
        search.length === 0 ||
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        String(task.id).includes(search);
      const matchesStatus = filters.status === 'ALL' || task.status === filters.status;
      const matchesPriority = filters.priority === 'ALL' || task.priority === filters.priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [filters, tasksQuery.data]);

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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by title, description or ID"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
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
              onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="LOW">LOW</MenuItem>
              <MenuItem value="MEDIUM">MEDIUM</MenuItem>
              <MenuItem value="HIGH">HIGH</MenuItem>
              <MenuItem value="URGENT">URGENT</MenuItem>
            </TextField>

            <Button variant="outlined" onClick={() => void tasksQuery.refetch()} disabled={tasksQuery.isFetching}>
              Refresh
            </Button>
          </Stack>

          <TasksTable
            rows={rows}
            loading={tasksQuery.isLoading}
            error={tasksQuery.isError}
            onRetry={() => void tasksQuery.refetch()}
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