import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { VehicleResponse } from '../types/vehicle.types';

type Props = {
  rows: VehicleResponse[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onEdit: (vehicle: VehicleResponse) => void;
  onDelete: (vehicle: VehicleResponse) => void;
  canManage: boolean;
};

export default function VehiclesTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  canManage,
}: Props) {
  const columns: DataTableColumn<VehicleResponse>[] = [
    {
      id: 'registrationNumber',
      header: 'Registration',
      accessor: 'registrationNumber',
      minWidth: 140,
    },
    {
      id: 'brand',
      header: 'Brand',
      accessor: 'brand',
      minWidth: 120,
    },
    {
      id: 'model',
      header: 'Model',
      accessor: 'model',
      minWidth: 120,
    },
    {
      id: 'type',
      header: 'Type',
      accessor: 'type',
      minWidth: 120,
    },
    {
      id: 'capacity',
      header: 'Capacity',
      accessor: 'capacity',
      minWidth: 100,
    },
    {
      id: 'company',
      header: 'Company',
      minWidth: 140,
      render: (row) => <Typography variant="body2">{row.companyName ?? '—'}</Typography>,
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 130,
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <StatusChip value={row.status} />
        </Stack>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      minWidth: canManage ? 260 : 120,
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            component={RouterLink}
            to={`/vehicles/${row.id}`}
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
            <Button
              size="small"
              color="error"
              variant="text"
              onClick={() => onDelete(row)}
            >
              Delete
            </Button>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <DataTable<VehicleResponse>
      rows={rows}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(row) => row.id}
      columns={columns}
    />
  );
}