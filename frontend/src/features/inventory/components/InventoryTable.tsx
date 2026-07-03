import type { ReactNode } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import type { InventoryListRow } from '../types/inventory.types';
import InventoryStatusChip from './InventoryStatusChip';


function formatMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  return currency ? `${value} ${currency}` : String(value);
}

type Props = {
  rows: InventoryListRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEdit: (row: InventoryListRow) => void;
  onReserve: (row: InventoryListRow) => void;
  onReleaseReservation: (row: InventoryListRow) => void;
  canManage: boolean;
  pagination?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
};

export default function InventoryTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onReserve,
  onReleaseReservation,
  canManage,
  pagination,
  sort,
  onSortChange,
}: Props) {
  const navigate = useNavigate();
  const columns: DataTableColumn<InventoryListRow>[] = [
    {
      id: 'warehouseName',
      header: 'Warehouse',
      minWidth: 190,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>{row.warehouseName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.warehouseCity ?? '—'} · {row.warehouseStatus ?? '—'}</Typography>
        </Stack>
      ),
    },
    {
      id: 'productName',
      header: 'Product',
      minWidth: 190,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>{row.productName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.productSku ?? '—'} · {row.productUnit ?? '—'}</Typography>
        </Stack>
      ),
    },
    {
      id: 'quantity',
      header: 'Total',
      accessor: 'quantity',
      sortField: 'quantity',
      minWidth: 100,
    },
    {
      id: 'reservedQuantity',
      header: 'Reserved',
      accessor: 'reservedQuantity',
      sortField: 'reservedQuantity',
      minWidth: 100,
    },
    {
      id: 'availableQuantity',
      header: 'Available',
      accessor: 'availableQuantity',
      minWidth: 100,
    },
    {
      id: 'minStockLevel',
      header: 'Min stock',
      accessor: 'minStockLevel',
      sortField: 'minStockLevel',
      minWidth: 100,
    },

    {
      id: 'valuation',
      header: 'Value',
      minWidth: 160,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>{formatMoney(row.totalValue, row.currency)}</Typography>
          <Typography variant="caption" color="text.secondary">Avg: {formatMoney(row.averageUnitCost, row.currency)}</Typography>
        </Stack>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 120,
      render: (row) => <InventoryStatusChip status={row.derivedStatus} />,
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: 'Actions',
            minWidth: 240,
            sticky: 'right' as const,
            align: 'right' as const,
            render: (row: InventoryListRow) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" variant="contained" onClick={() => onEdit(row)}>
                  Edit
                </Button>

                <Button size="small" variant="outlined" disabled={row.availableQuantity <= 0} onClick={() => onReserve(row)}>
                  Reserve
                </Button>

                <Button size="small" variant="outlined" disabled={row.reservedQuantity <= 0} onClick={() => onReleaseReservation(row)}>
                  Release
                </Button>

              </Stack>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable<InventoryListRow>
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(row) => `${row.warehouseId}-${row.productId}`}
      columns={columns}
      pagination={pagination}
      sort={sort}
      onSortChange={onSortChange}
      getRowStatus={(row) => row.derivedStatus}
      emptyTitle="No inventory records found"
      emptyDescription="There are no inventory records that match the current filters."
      minWidth={1340}
      onRowClick={(row) => navigate(`/inventory/${row.warehouseId}/${row.productId}`)}
      rowClickLabel="Open inventory details"
    />
  );
}
