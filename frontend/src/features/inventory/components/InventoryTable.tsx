import type { ReactNode } from 'react';
import { Button, Stack } from '@mui/material';
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
            align: 'right' as const,
            render: (row: InventoryListRow) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" variant="contained" onClick={() => onEdit(row)}>
                  Edit
                </Button>

                <Button size="small" color="error" variant="text" onClick={() => onDelete(row)}>
                  Delete
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
    />
  );
}
