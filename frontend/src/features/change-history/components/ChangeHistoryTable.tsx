import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { ChangeHistoryResponse } from '../types/changeHistory.types';

type ChangeHistoryTableProps = {
  rows: ChangeHistoryResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  pagination?: ReactNode;
};

export default function ChangeHistoryTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  pagination,
}: ChangeHistoryTableProps) {
  const columns: DataTableColumn<ChangeHistoryResponse>[] = [
    {
      id: 'id',
      header: 'ID',
      minWidth: 90,
      nowrap: true,
      render: (row) => row.id,
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
            Entity ID: {row.entityId}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'changeType',
      header: 'Change type',
      minWidth: 160,
      render: (row) => row.changeType,
    },
    {
      id: 'fieldName',
      header: 'Field',
      minWidth: 180,
      render: (row) => row.fieldName ?? '—',
    },
    {
      id: 'oldValue',
      header: 'Old value',
      minWidth: 260,
      render: (row) => row.oldValue ?? '—',
    },
    {
      id: 'newValue',
      header: 'New value',
      minWidth: 260,
      render: (row) => row.newValue ?? '—',
    },
    {
      id: 'userId',
      header: 'User ID',
      minWidth: 110,
      nowrap: true,
      render: (row) => row.userId,
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
      emptyTitle="No change history found"
      emptyDescription="There are no change history records for the current filter combination."
      minWidth={1280}
      pagination={pagination}
    />
  );
}