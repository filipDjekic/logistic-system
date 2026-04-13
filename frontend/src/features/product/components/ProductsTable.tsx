import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { ProductResponse } from '../types/product.types';

type Props = {
  rows: ProductResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEdit: (row: ProductResponse) => void;
  onDelete: (row: ProductResponse) => void;
  canManage: boolean;
};

export default function ProductsTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  canManage,
}: Props) {
  const columns: DataTableColumn<ProductResponse>[] = [
    { id: 'name', header: 'Name', accessor: 'name', minWidth: 160 },
    { id: 'sku', header: 'SKU', accessor: 'sku', minWidth: 120 },
    { id: 'unit', header: 'Unit', accessor: 'unit', minWidth: 100 },
    { id: 'price', header: 'Price', accessor: 'price', minWidth: 100 },
    { id: 'weight', header: 'Weight', accessor: 'weight', minWidth: 100 },
    {
      id: 'fragile',
      header: 'Fragile',
      minWidth: 100,
      render: (row) => (row.fragile ? 'Yes' : 'No'),
    },
    {
      id: 'company',
      header: 'Company',
      minWidth: 140,
      render: (row) => <Typography>{row.companyName ?? '—'}</Typography>,
    },
    {
      id: 'active',
      header: 'Status',
      minWidth: 120,
      render: (row) => <StatusChip value={row.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      minWidth: 220,
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            component={RouterLink}
            to={`/products/${row.id}`}
            size="small"
            variant="outlined"
          >
            Details
          </Button>

          {canManage ? (
            <Button size="small" variant="contained" onClick={() => onEdit(row)}>
              Edit
            </Button>
          ) : null}

          {canManage ? (
            <Button size="small" color="error" variant="text" onClick={() => onDelete(row)}>
              Delete
            </Button>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <DataTable<ProductResponse>
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(row) => row.id}
      columns={columns}
    />
  );
}
