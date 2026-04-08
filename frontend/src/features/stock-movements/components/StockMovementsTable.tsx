import dayjs from 'dayjs';
import { Stack, Typography } from '@mui/material';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type {
  StockMovementProductOption,
  StockMovementResponse,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';

type StockMovementsTableProps = {
  rows: StockMovementResponse[];
  warehousesById: Record<number, StockMovementWarehouseOption>;
  productsById: Record<number, StockMovementProductOption>;
  transportOrdersById: Record<number, StockMovementTransportOrderOption>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

function formatQuantity(value: number, unit?: string) {
  return unit ? `${value} ${unit}` : String(value);
}

export default function StockMovementsTable({
  rows,
  warehousesById,
  productsById,
  transportOrdersById,
  loading = false,
  error = false,
  onRetry,
}: StockMovementsTableProps) {
  const columns: DataTableColumn<StockMovementResponse>[] = [
    {
      id: 'createdAt',
      header: 'Created',
      minWidth: 170,
      nowrap: true,
      render: (row) => dayjs(row.createdAt).format('DD.MM.YYYY. HH:mm'),
    },
    {
      id: 'movementType',
      header: 'Movement',
      minWidth: 150,
      render: (row) => <StatusChip value={row.movementType} />,
    },
    {
      id: 'warehouse',
      header: 'Warehouse',
      minWidth: 220,
      render: (row) => {
        const warehouse = warehousesById[row.warehouseId];

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {warehouse?.name ?? `Warehouse #${row.warehouseId}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {warehouse ? `${warehouse.city} · #${warehouse.id}` : `#${row.warehouseId}`}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'product',
      header: 'Product',
      minWidth: 240,
      render: (row) => {
        const product = productsById[row.productId];

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {product?.name ?? `Product #${row.productId}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {product ? `${product.sku} · #${product.id}` : `#${row.productId}`}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'quantity',
      header: 'Quantity',
      minWidth: 130,
      nowrap: true,
      render: (row) =>
        formatQuantity(row.quantity, productsById[row.productId]?.unit),
    },
    {
      id: 'stockChange',
      header: 'Stock',
      minWidth: 190,
      render: (row) => {
        const unit = productsById[row.productId]?.unit;

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2">
              Before: {formatQuantity(row.quantityBefore, unit)}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              After: {formatQuantity(row.quantityAfter, unit)}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'reservedChange',
      header: 'Reserved',
      minWidth: 190,
      render: (row) => {
        const unit = productsById[row.productId]?.unit;

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2">
              Before: {formatQuantity(row.reservedBefore, unit)}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              After: {formatQuantity(row.reservedAfter, unit)}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'availableChange',
      header: 'Available',
      minWidth: 190,
      render: (row) => {
        const unit = productsById[row.productId]?.unit;

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2">
              Before: {formatQuantity(row.availableBefore, unit)}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              After: {formatQuantity(row.availableAfter, unit)}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'reasonCode',
      header: 'Reason',
      minWidth: 180,
      render: (row) => <StatusChip value={row.reasonCode} />,
    },
    {
      id: 'reference',
      header: 'Reference',
      minWidth: 260,
      render: (row) => {
        const transportOrder =
          row.transportOrderId !== null
            ? transportOrdersById[row.transportOrderId]
            : undefined;

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {row.referenceType}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.referenceNumber ||
                transportOrder?.orderNumber ||
                (row.referenceId ? `Reference #${row.referenceId}` : '—')}
            </Typography>
            {row.referenceNote ? (
              <Typography variant="caption" color="text.secondary">
                {row.referenceNote}
              </Typography>
            ) : null}
          </Stack>
        );
      },
    },
    {
      id: 'createdById',
      header: 'Created by',
      minWidth: 120,
      nowrap: true,
      render: (row) => `#${row.createdById}`,
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
      emptyTitle="No stock movements found"
      emptyDescription="There are no stock movement records for the current filter combination."
      minWidth={1900}
    />
  );
}