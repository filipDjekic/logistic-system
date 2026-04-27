import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { ActivityLogResponse } from '../types/activityLog.types';

type ActivityLogsTableProps = {
  rows: ActivityLogResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  pagination?: ReactNode;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function ActivityLogsTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  pagination,
}: ActivityLogsTableProps) {
  const columns: DataTableColumn<ActivityLogResponse>[] = [
    {
      id: 'id',
      header: 'ID',
      minWidth: 90,
      nowrap: true,
      render: (row) => row.id,
    },
    {
      id: 'action',
      header: 'Action',
      minWidth: 160,
      render: (row) => row.action,
    },
    {
      id: 'entity',
      header: 'Entity',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {row.entityName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Entity ID: {row.entityId ?? '—'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      minWidth: 320,
      render: (row) => row.description ?? '—',
    },
    {
      id: 'userId',
      header: 'User ID',
      minWidth: 110,
      nowrap: true,
      render: (row) => row.userId,
    },
    {
      id: 'createdAt',
      header: 'Created at',
      minWidth: 190,
      nowrap: true,
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No activity logs found"
      emptyDescription="There are no activity log records for the current filter combination."
      minWidth={1100}
      pagination={pagination}
    />
  );
}