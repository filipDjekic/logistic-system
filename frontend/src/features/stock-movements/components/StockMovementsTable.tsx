import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { StockMovementResponse } from '../types/stockMovement.types';

type Props = {
  rows: StockMovementResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function StockMovementsTable({
  rows,
  loading,
  error,
  onRetry,
}: Props) {
  const columns: DataTableColumn<StockMovementResponse>[] = [
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
      id: 'movementType',
      header: 'Type',
      accessor: 'movementType',
      minWidth: 120,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessor: 'quantity',
      minWidth: 100,
    },
    {
      id: 'quantityBefore',
      header: 'Before',
      accessor: 'quantityBefore',
      minWidth: 100,
    },
    {
      id: 'quantityAfter',
      header: 'After',
      accessor: 'quantityAfter',
      minWidth: 100,
    },
    {
      id: 'createdAt',
      header: 'Created at',
      minWidth: 180,
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
    />
  );
}