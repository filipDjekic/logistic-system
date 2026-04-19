import { Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { TaskResponse } from '../types/task.types';
import TaskStatusChip from './TaskStatusChip';

type Props = {
  rows: TaskResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  canMutate: boolean;
  onEdit: (row: TaskResponse) => void;
  onDelete: (row: TaskResponse) => void;
  showLinks?: boolean;
};

export default function TasksTable({
  rows,
  loading,
  error,
  onRetry,
  canMutate,
  onEdit,
  onDelete,
  showLinks = true,
}: Props) {
  const columns: DataTableColumn<TaskResponse>[] = [
    {
      id: 'title',
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
      header: 'Status',
      minWidth: 140,
      render: (row) => <TaskStatusChip status={row.status} />,
    },
    {
      id: 'dueDate',
      header: 'Due date',
      minWidth: 180,
      render: (row) => new Date(row.dueDate).toLocaleString(),
    },
    {
      id: 'assignedEmployeeId',
      header: 'Employee ID',
      accessor: 'assignedEmployeeId',
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
    />
  );
}