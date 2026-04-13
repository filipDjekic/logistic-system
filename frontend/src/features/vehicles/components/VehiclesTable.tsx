import { Stack, Typography } from '@mui/material';
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
  canManage: boolean;
};

export default function VehiclesTable({
  rows,
  loading,
  error,
  onRetry,
  onEdit,
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
    ...(canManage
      ? [
          {
            id: 'actions',
            header: 'Actions',
            minWidth: 120,
            render: (row: VehicleResponse) => (
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
            ),
          },
        ]
      : []),
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