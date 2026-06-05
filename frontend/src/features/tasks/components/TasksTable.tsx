import type { ReactNode } from 'react';
import { Button, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import { MobileOperationalCard } from '../../../shared/components/Mobile';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import type { TaskResponse, TaskStatus } from '../types/task.types';
import { canMutateManagedTask, getAllowedTaskStatusTransitions } from '../../../core/permissions/operationGuards';
import type { Role } from '../../../core/constants/roles';
import TaskStatusChip from './TaskStatusChip';
import { formatTemporalView, formatTemporalZone } from '../../../core/utils/timezoneFormat';

type Props = {
  rows: TaskResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  role?: Role | null;
  canMutate: boolean;
  onEdit: (row: TaskResponse) => void;
  onDelete: (row: TaskResponse) => void;
  canChangeStatus?: boolean;
  updatingStatusId?: number | null;
  onStatusChange?: (row: TaskResponse, status: TaskStatus) => void;
  showLinks?: boolean;
  pagination?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
};

export default function TasksTable({
  rows,
  loading,
  error,
  onRetry,
  role = null,
  canMutate,
  onEdit,
  onDelete,
  canChangeStatus = false,
  updatingStatusId = null,
  onStatusChange,
  showLinks = true,
  pagination,
  sort,
  onSortChange,
}: Props) {
  const navigate = useNavigate();
  const columns: DataTableColumn<TaskResponse>[] = [
    {
      id: 'title',
      sortField: 'title',
      header: 'Title',
      minWidth: 220,
      render: (row) =>
        showLinks ? (
          <Typography
            component={Link}
            to={`/tasks/${row.id}`}
            sx={{ color: 'primary.main', textDecoration: 'none' }}
          >
            {row.title}
          </Typography>
        ) : (
          row.title
        ),
    },
    { id: 'priority', header: 'Priority', accessor: 'priority', sortField: 'priority', minWidth: 120 },
    { id: 'taskType', header: 'Type', accessor: 'taskType', sortField: 'taskType', minWidth: 140 },
    {
      id: 'status',
      sortField: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => {
        const isUpdating = updatingStatusId === row.id;

        const allowedStatuses = canChangeStatus && onStatusChange
          ? getAllowedTaskStatusTransitions(role, row)
          : [];

        if (allowedStatuses.length === 0 || !onStatusChange) {
          return <TaskStatusChip status={row.status} />;
        }

        return (
          <Select
            size="small"
            value={row.status}
            disabled={isUpdating}
            onChange={(event) => onStatusChange(row, event.target.value as TaskStatus)}
            sx={{ minWidth: 145 }}
          >
            <MenuItem value={row.status}>{row.status}</MenuItem>
            {allowedStatuses.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      id: 'dueDate',
      sortField: 'dueDate',
      header: 'Due date',
      minWidth: 180,
      render: (row) => `${formatTemporalView(row.dueDateView, row.dueDate)} (${formatTemporalZone(row.dueDateView, row.dueDateTimezone)})`,
    },
    {
      id: 'assignedEmployeeId',
      header: 'Employee',
      accessor: 'assignedEmployeeId',
      sortField: 'assignedEmployeeId',
      minWidth: 120,
    },
    {
      id: 'transportOrderId',
      header: 'Transport order',
      minWidth: 110,
      render: (row) => row.transportOrderId ?? '—',
    },
    {
      id: 'stockMovementId',
      header: 'Stock movement',
      minWidth: 110,
      render: (row) => row.stockMovementId ?? '—',
    },
    ...(canMutate
      ? [
          {
            id: 'actions',
            header: 'Actions',
            minWidth: 170,
            sticky: 'right' as const,
            align: 'right' as const,
            render: (row: TaskResponse) => {
              const canMutateRow = canMutateManagedTask(role, row);

              if (!canMutateRow) {
                return <Typography variant="body2" color="text.secondary">Locked</Typography>;
              }

              return (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button variant="text" size="small" onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                  <Button variant="text" size="small" color="error" onClick={() => onDelete(row)}>
                    Delete
                  </Button>
                </Stack>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <DataTable<TaskResponse>
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={pagination}
      sort={sort}
      onSortChange={onSortChange}
      getRowStatus={(row) => row.status}
      emptyTitle="No tasks found"
      emptyDescription="There are no tasks that match the current filters."
      minWidth={1120}
      onRowClick={showLinks ? (row) => navigate(`/tasks/${row.id}`) : undefined}
      rowClickLabel="Open task details"
      renderMobileCard={(row) => (
        <MobileOperationalCard
          overline={`${row.priority} · ${row.taskType}`}
          title={row.title}
          status={<TaskStatusChip status={row.status} />}
          meta={`${formatTemporalView(row.dueDateView, row.dueDate)} (${formatTemporalZone(row.dueDateView, row.dueDateTimezone)})`}
          onClick={showLinks ? () => navigate(`/tasks/${row.id}`) : undefined}
          actions={
            <Stack direction="row" spacing={1}>
              {showLinks ? (
                <Button fullWidth variant="outlined" size="small" component={Link} to={`/tasks/${row.id}`}>
                  Open
                </Button>
              ) : null}
              {canMutate && canMutateManagedTask(role, row) ? (
                <Button fullWidth variant="text" size="small" onClick={() => onEdit(row)}>
                  Edit
                </Button>
              ) : null}
            </Stack>
          }
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">Employee: {row.assignedEmployeeId ?? '—'}</Typography>
            <Typography variant="body2" color="text.secondary">Transport: {row.transportOrderId ?? '—'} · Stock movement: {row.stockMovementId ?? '—'}</Typography>
          </Stack>
        </MobileOperationalCard>
      )}
    />
  );
}