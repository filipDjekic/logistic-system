import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { VehicleResponse } from '../types/vehicle.types';
import VehicleStatusChip from './VehicleStatusChip';

type VehiclesTableProps = {
  rows: VehicleResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: (vehicle: VehicleResponse) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatCapacity(value: number) {
  return `${value} kg`;
}

export default function VehiclesTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  onEdit,
  emptyTitle,
  emptyDescription,
}: VehiclesTableProps) {
  const columns: DataTableColumn<VehicleResponse>[] = [
    {
      id: 'registrationNumber',
      header: 'Registration',
      minWidth: 160,
      nowrap: true,
      render: (row) => (
        <Typography variant="body2" fontWeight={700}>
          {row.registrationNumber}
        </Typography>
      ),
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {row.brand} {row.model}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.type}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'capacity',
      header: 'Capacity',
      minWidth: 120,
      nowrap: true,
      render: (row) => formatCapacity(row.capacity),
    },
    {
      id: 'fuelType',
      header: 'Fuel',
      minWidth: 140,
      render: (row) => row.fuelType,
    },
    {
      id: 'yearOfProduction',
      header: 'Year',
      minWidth: 100,
      nowrap: true,
      render: (row) => row.yearOfProduction,
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 150,
      render: (row) => <VehicleStatusChip status={row.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      minWidth: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            component={RouterLink}
            to={`/vehicles/${row.id}`}
            variant="text"
            size="small"
          >
            Details
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => onEdit?.(row)}
          >
            Edit
          </Button>
        </Stack>
      ),
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
      emptyTitle={emptyTitle ?? 'No vehicles found'}
      emptyDescription={
        emptyDescription ?? 'There are no vehicles for the current filter combination.'
      }
      minWidth={1100}
    />
  );
}