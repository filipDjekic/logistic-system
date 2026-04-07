import { Button, Stack, Typography } from '@mui/material';
import type { DataTableColumn } from '../../../shared/types/common.types';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type {
  ProductOption,
  TransportOrderItemResponse,
} from '../types/transportOrder.types';

type TransportOrderItemsTableProps = {
  rows: TransportOrderItemResponse[];
  productsById?: Record<number, ProductOption>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onDelete?: (item: TransportOrderItemResponse) => void;
  deletingItemId?: number | null;
  showActions?: boolean;
};

function formatWeight(value: number | null) {
  if (value == null) {
    return '—';
  }

  return `${value} kg`;
}

export default function TransportOrderItemsTable({
  rows,
  productsById,
  loading = false,
  error = false,
  onRetry,
  onDelete,
  deletingItemId = null,
  showActions = false,
}: TransportOrderItemsTableProps) {
  const columns: DataTableColumn<TransportOrderItemResponse>[] = [
    {
      id: 'product',
      header: 'Product',
      minWidth: 280,
      render: (row) => {
        const product = productsById?.[row.productId];

        if (!product) {
          return <Typography variant="body2">Product #{row.productId}</Typography>;
        }

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {product.sku} · {product.unit}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'quantity',
      header: 'Quantity',
      minWidth: 120,
      nowrap: true,
      render: (row) => row.quantity,
    },
    {
      id: 'weight',
      header: 'Weight',
      minWidth: 120,
      nowrap: true,
      render: (row) => formatWeight(row.weight),
    },
    {
      id: 'note',
      header: 'Note',
      minWidth: 260,
      render: (row) => row.note?.trim() || '—',
    },
    ...(showActions
      ? [
          {
            id: 'actions',
            header: 'Actions',
            align: 'right' as const,
            minWidth: 120,
            render: (row: TransportOrderItemResponse) => (
              <Button
                variant="text"
                size="small"
                color="error"
                disabled={deletingItemId === row.id}
                onClick={() => onDelete?.(row)}
              >
                Remove
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No transport order items found"
      emptyDescription="This transport order does not have any items yet."
      minWidth={showActions ? 900 : 780}
    />
  );
}