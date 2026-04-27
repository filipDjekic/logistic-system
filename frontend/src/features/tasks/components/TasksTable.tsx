import type { ReactNode } from 'react';
import { MenuItem, Select, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import type { TaskResponse, TaskStatus } from '../types/task.types';
import TaskStatusChip from './TaskStatusChip';

type Props = {
  rows: TaskResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
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
    { id: 'priority', header: 'Priority', accessor: 'priority', minWidth: 120 },
    {
      id: 'status',
      sortField: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => {
        const isUpdating = updatingStatusId === row.id;

        if (!canChangeStatus || !onStatusChange || row.status === 'COMPLETED' || row.status === 'CANCELLED') {
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
            <MenuItem value="NEW">NEW</MenuItem>
            <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
          </Select>
        );
      },
    },
    {
      id: 'dueDate',
      sortField: 'dueDate',
      header: 'Due date',
      minWidth: 180,
      render: (row) => new Date(row.dueDate).toLocaleString(),
    },
    {
      id: 'assignedEmployeeId',
      header: 'Employee ID',
      accessor: 'assignedEmployeeId',
      sortField: 'assignedEmployeeId',
      minWidth: 120,
    },
    {
      id: 'transportOrderId',
      header: 'Transport',
      minWidth: 110,
      render: (row) => row.transportOrderId ?? '—',
    },
    {
      id: 'stockMovementId',
      header: 'Movement',
      minWidth: 110,
      render: (row) => row.stockMovementId ?? '—',
    },
    ...(canMutate
      ? [
          {
            id: 'actions',
            header: 'Actions',
            minWidth: 160,
            render: (row: TaskResponse) => (
              <Stack direction="row" spacing={1.5}>
                <Typography
                  component="button"
                  sx={{
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'primary.main',
                    p: 0,
                  }}
                  onClick={() => onEdit(row)}
                >
                  Edit
                </Typography>
                <Typography
                  component="button"
                  sx={{
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'error.main',
                    p: 0,
                  }}
                  onClick={() => onDelete(row)}
                >
                  Delete
                </Typography>
              </Stack>
            ),
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
    />
  );
}