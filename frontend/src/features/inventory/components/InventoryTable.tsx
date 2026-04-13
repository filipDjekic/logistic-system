import { Stack, Typography } from '@mui/material';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
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
};

export default function InventoryTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  canManage,
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
      minWidth: 100,
    },
    {
      id: 'reservedQuantity',
      header: 'Reserved',
      accessor: 'reservedQuantity',
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
    />
  );
}