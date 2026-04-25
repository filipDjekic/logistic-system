import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import type { InventoryListRow } from '../types/inventory.types';
import InventoryStatusChip from './InventoryStatusChip';

type Props = {
  rows: InventoryListRow[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEdit: (row: InventoryListRow) => void;
  onDelete: (row: InventoryListRow) => void;
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
  onDelete,
  canManage,
  pagination,
  sort,
  onSortChange,
}: Props) {
  const columns: DataTableColumn<InventoryListRow>[] = [
    {
      id: 'warehouseName',
      header: 'Warehouse',
      accessor: 'warehouseName',
      minWidth: 160,
    },
    {
      id: 'productName',
      header: 'Product',
      accessor: 'productName',
      minWidth: 160,
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
            minWidth: 160,
            render: (row: InventoryListRow) => (
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
    />
  );
}