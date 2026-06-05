import type { ReactNode } from 'react';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getEntityDetailsPath } from '../../../core/utils/entityRoutes';
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

function ChangeValue({ label, value }: { label: string; value: string | null }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

export default function ChangeHistoryTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  pagination,
}: ChangeHistoryTableProps) {
  const columns: DataTableColumn<ChangeHistoryResponse>[] = [
    {
      id: 'entity',
      header: 'Entity',
      minWidth: 260,
      render: (row) => {
        const path = getEntityDetailsPath({ entityName: row.entityName, entityId: row.entityId });

        return (
          <Stack spacing={0.75}>
            <Typography variant="body2" fontWeight={800}>{row.entityName}</Typography>
            <Typography variant="caption" color="text.secondary">Entity ID: {row.entityId}</Typography>
            {path ? (
              <Button component={RouterLink} to={path} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                Open entity
              </Button>
            ) : null}
          </Stack>
        );
      },
    },
    {
      id: 'changeType',
      header: 'Change type',
      minWidth: 160,
      render: (row) => <Chip size="small" label={row.changeType} />,
    },
    {
      id: 'fieldName',
      header: 'Field',
      minWidth: 180,
      render: (row) => row.fieldName ?? '—',
    },
    {
      id: 'diff',
      header: 'Change diff',
      minWidth: 420,
      render: (row) => (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <ChangeValue label="Old" value={row.oldValue} />
          <ChangeValue label="New" value={row.newValue} />
        </Stack>
      ),
    },
    {
      id: 'userId',
      header: 'User ID',
      minWidth: 110,
      nowrap: true,
      render: (row) => row.userId,
    },
    {
      id: 'id',
      header: 'Record ID',
      minWidth: 110,
      nowrap: true,
      render: (row) => row.id,
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
      minWidth={1180}
      pagination={pagination}
    />
  );
}
