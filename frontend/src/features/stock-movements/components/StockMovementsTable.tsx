import type { ReactNode } from 'react';
import DataTable from '../../../shared/components/DataTable/DataTable';
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
      sortField: 'movementType',
      minWidth: 120,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessor: 'quantity',
      sortField: 'quantity',
      minWidth: 100,
    },
    {
      id: 'quantityBefore',
      header: 'Before',
      accessor: 'quantityBefore',
      sortField: 'quantityBefore',
      minWidth: 100,
    },
    {
      id: 'quantityAfter',
      header: 'After',
      accessor: 'quantityAfter',
      sortField: 'quantityAfter',
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
      pagination={pagination}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}