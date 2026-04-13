import { Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { WarehouseResponse } from '../types/warehouse.types';

type Props = {
  rows: WarehouseResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEdit: (warehouse: WarehouseResponse) => void;
  onDelete: (warehouse: WarehouseResponse) => void;
  canManage: boolean;
};

export default function WarehousesTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  canManage,
}: Props) {
  const columns: DataTableColumn<WarehouseResponse>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      minWidth: 180,
    },
    {
      id: 'city',
      header: 'City',
      accessor: 'city',
      minWidth: 140,
    },
    {
      id: 'address',
      header: 'Address',
      accessor: 'address',
      minWidth: 240,
    },
    {
      id: 'capacity',
      header: 'Capacity',
      accessor: 'capacity',
      minWidth: 120,
    },
    {
      id: 'managerName',
      header: 'Manager',
      minWidth: 180,
      render: (warehouse) => warehouse.managerName ?? '—',
    },
    {
      id: 'companyName',
      header: 'Company',
      minWidth: 180,
      render: (warehouse) => warehouse.companyName ?? '—',
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 160,
      render: (warehouse) => (
        <Stack direction="row" spacing={1}>
          <StatusChip value={warehouse.status} />
        </Stack>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      minWidth: 220,
      align: 'right',
      render: (warehouse) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            component={RouterLink}
            to={`/warehouses/${warehouse.id}`}
            size="small"
            variant="outlined"
          >
            Details
          </Button>

          {canManage ? (
            <Button size="small" variant="contained" onClick={() => onEdit(warehouse)}>
              Edit
            </Button>
          ) : null}

          {canManage ? (
            <Button size="small" color="error" variant="text" onClick={() => onDelete(warehouse)}>
              Delete
            </Button>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <DataTable<WarehouseResponse>
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(warehouse) => warehouse.id}
      columns={columns}
    />
  );
}
