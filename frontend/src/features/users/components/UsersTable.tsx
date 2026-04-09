import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { UserResponse } from '../types/user.types';
import UserStatusChip from './UserStatusChip';

type UsersTableProps = {
  rows: UserResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: (user: UserResponse) => void;
  showAdminActions?: boolean;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

export default function UsersTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  onEdit,
  showAdminActions = false,
}: UsersTableProps) {
  const columns: DataTableColumn<UserResponse>[] = [
    {
      id: 'user',
      header: 'User',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {row.firstName} {row.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'roleName',
      header: 'Role',
      minWidth: 160,
      render: (row) => row.roleName,
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <UserStatusChip value={row.status} />,
    },
    {
      id: 'enabled',
      header: 'Enabled',
      minWidth: 130,
      render: (row) => <StatusChip value={row.enabled ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      id: 'createdAt',
      header: 'Created',
      minWidth: 180,
      nowrap: true,
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      id: 'updatedAt',
      header: 'Updated',
      minWidth: 180,
      nowrap: true,
      render: (row) => formatDateTime(row.updatedAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      minWidth: 220,
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {showAdminActions ? (
            <Button
              component={RouterLink}
              to={`/users/${row.id}`}
              size="small"
              variant="outlined"
            >
              Details
            </Button>
          ) : null}

          {showAdminActions && onEdit ? (
            <Button size="small" variant="contained" onClick={() => onEdit(row)}>
              Edit
            </Button>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No users found"
      emptyDescription="There are no user records for the current filter combination."
    />
  );
}