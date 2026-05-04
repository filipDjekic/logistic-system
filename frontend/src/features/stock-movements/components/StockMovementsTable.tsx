import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import type { StockMovementResponse } from '../types/stockMovement.types';

type Props = {
  rows: StockMovementResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  pagination?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatOptionalNumber(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : value;
}

export default function StockMovementsTable({
  rows,
  loading,
  error,
  onRetry,
  pagination,
  sort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<StockMovementResponse>[] = [
    {
      id: 'movement',
      header: 'Movement',
      sortField: 'movementType',
      minWidth: 210,
      render: (row) => (
        <Stack spacing={0.25}>
          <StatusChip value={row.movementType} />
          <Typography variant="caption" color="text.secondary">
            #{row.id}{row.adjustmentDirection ? ` · ${row.adjustmentDirection}` : ''}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'warehouseProduct',
      header: 'Warehouse / product',
      minWidth: 260,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>{row.warehouseName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.productName}</Typography>
        </Stack>
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessor: 'quantity',
      sortField: 'quantity',
      minWidth: 100,
    },
    {
      id: 'stockBalance',
      header: 'Stock balance',
      minWidth: 150,
      render: (row) => `${row.quantityBefore} → ${row.quantityAfter}`,
    },
    {
      id: 'reservedBalance',
      header: 'Reserved',
      minWidth: 130,
      render: (row) => `${formatOptionalNumber(row.reservedBefore)} → ${formatOptionalNumber(row.reservedAfter)}`,
    },
    {
      id: 'availableBalance',
      header: 'Available',
      minWidth: 130,
      render: (row) => `${formatOptionalNumber(row.availableBefore)} → ${formatOptionalNumber(row.availableAfter)}`,
    },
    {
      id: 'reference',
      header: 'Reference',
      minWidth: 240,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>{row.referenceNumber ?? row.referenceType ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.referenceType ?? 'No type'}{row.referenceId ? ` · #${row.referenceId}` : ''}{row.transportOrderId ? ` · Transport #${row.transportOrderId}` : ''}
          </Typography>
          {row.transferGroupId ? (
            <Typography variant="caption" color="text.secondary">Transfer group: {row.transferGroupId}</Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      id: 'reason',
      header: 'Reason',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.reasonCode ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.reasonDescription ?? row.referenceNote ?? '—'}</Typography>
        </Stack>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created at',
      sortField: 'createdAt',
      minWidth: 180,
      nowrap: true,
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <DataTable<StockMovementResponse>
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(row) => row.id}
      columns={columns}
      pagination={pagination}
      sort={sort}
      onSortChange={onSortChange}
      getRowStatus={(row) => row.movementType}
      emptyTitle="No stock movements found"
      emptyDescription="There are no stock movements that match the current filters."
      minWidth={1540}
    />
  );
}
