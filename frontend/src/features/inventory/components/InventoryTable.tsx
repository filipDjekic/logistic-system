import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { InventoryListRow } from '../types/inventory.types';
import InventoryStatusChip from './InventoryStatusChip';

type InventoryTableProps = {
  rows: InventoryListRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatQuantity(value: number, unit: string) {
  return `${value} ${unit}`;
}

export default function InventoryTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  emptyTitle,
  emptyDescription,
}: InventoryTableProps) {
  const columns: DataTableColumn<InventoryListRow>[] = [
    {
      id: 'warehouse',
      header: 'Warehouse',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {row.warehouseName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.warehouseCity} · #{row.warehouseId}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'product',
      header: 'Product',
      minWidth: 240,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {row.productName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.productSku} · #{row.productId}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      minWidth: 140,
      nowrap: true,
      render: (row) => formatQuantity(row.quantity, row.productUnit),
    },
    {
      id: 'reservedQuantity',
      header: 'Reserved',
      minWidth: 140,
      nowrap: true,
      render: (row) => formatQuantity(row.reservedQuantity, row.productUnit),
    },
    {
      id: 'availableQuantity',
      header: 'Available',
      minWidth: 140,
      nowrap: true,
      render: (row) => formatQuantity(row.availableQuantity, row.productUnit),
    },
    {
      id: 'minStockLevel',
      header: 'Min stock',
      minWidth: 140,
      nowrap: true,
      render: (row) =>
        row.minStockLevel === null
          ? '—'
          : formatQuantity(row.minStockLevel, row.productUnit),
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <InventoryStatusChip status={row.derivedStatus} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      minWidth: 140,
      render: (row) => (
        <Button
          component={RouterLink}
          to={`/inventory/${row.warehouseId}/${row.productId}`}
          variant="text"
          size="small"
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => `${row.warehouseId}-${row.productId}`}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={emptyTitle ?? 'No inventory records found'}
      emptyDescription={
        emptyDescription ?? 'There are no inventory records for the current filters.'
      }
      minWidth={1280}
    />
  );
}