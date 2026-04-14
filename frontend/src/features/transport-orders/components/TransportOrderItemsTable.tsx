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
  onEdit?: (item: TransportOrderItemResponse) => void;
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
  onEdit,
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
      render: (row) => <Typography variant="body2">{row.quantity}</Typography>,
    },
    {
      id: 'weight',
      header: 'Weight',
      minWidth: 120,
      render: (row) => <Typography variant="body2">{formatWeight(row.weight)}</Typography>,
    },
    {
      id: 'note',
      header: 'Note',
      minWidth: 220,
      render: (row) => (
        <Typography variant="body2" color={row.note ? 'text.primary' : 'text.secondary'}>
          {row.note?.trim() || '—'}
        </Typography>
      ),
    },
    ...(showActions
      ? [
          {
            id: 'actions',
            header: 'Actions',
            minWidth: 200,
            render: (row: TransportOrderItemResponse) => (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onEdit?.(row)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  disabled={deletingItemId === row.id}
                  onClick={() => onDelete?.(row)}
                >
                  Delete
                </Button>
              </Stack>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable<TransportOrderItemResponse>
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No items added"
      emptyDescription="There are no transport order items for this order yet."
    />
  );
}