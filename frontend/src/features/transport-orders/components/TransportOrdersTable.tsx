import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { DataTableColumn } from '../../../shared/types/common.types';
import DataTable from '../../../shared/components/DataTable/DataTable';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import TransportOrderStatusChip from './TransportOrderStatusChip';
import type {
  EmployeeOption,
  TransportOrderResponse,
  VehicleOption,
  WarehouseOption,
} from '../types/transportOrder.types';

type TransportOrdersTableProps = {
  rows: TransportOrderResponse[];
  warehousesById?: Record<number, WarehouseOption>;
  vehiclesById?: Record<number, VehicleOption>;
  employeesById?: Record<number, EmployeeOption>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatWeight(value: number | null) {
  if (value == null) {
    return '—';
  }

  return `${value} kg`;
}

export default function TransportOrdersTable({
  rows,
  warehousesById,
  vehiclesById,
  employeesById,
  loading = false,
  error = false,
  onRetry,
}: TransportOrdersTableProps) {
  const navigate = useNavigate();

  const columns: DataTableColumn<TransportOrderResponse>[] = [
    {
      id: 'orderNumber',
      header: 'Order',
      minWidth: 180,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {row.orderNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            #{row.id}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      minWidth: 260,
      render: (row) => {
        const source = warehousesById?.[row.sourceWarehouseId];
        const destination = warehousesById?.[row.destinationWarehouseId];

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {source?.name ?? `Warehouse #${row.sourceWarehouseId}`} →{' '}
              {destination?.name ?? `Warehouse #${row.destinationWarehouseId}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {source?.city ?? '—'} → {destination?.city ?? '—'}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'schedule',
      header: 'Schedule',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{formatDateTime(row.departureTime)}</Typography>
          <Typography variant="caption" color="text.secondary">
            Planned: {formatDateTime(row.plannedArrivalTime)}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      minWidth: 220,
      render: (row) => {
        const vehicle = vehiclesById?.[row.vehicleId];

        if (!vehicle) {
          return <Typography variant="body2">Vehicle #{row.vehicleId}</Typography>;
        }

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {vehicle.brand} {vehicle.model}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {vehicle.registrationNumber}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'driver',
      header: 'Driver',
      minWidth: 220,
      render: (row) => {
        const employee = employeesById?.[row.assignedEmployeeId];

        if (!employee) {
          return <Typography variant="body2">Employee #{row.assignedEmployeeId}</Typography>;
        }

        return (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {employee.firstName} {employee.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.email}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <TransportOrderStatusChip status={row.status} />,
    },
    {
      id: 'priority',
      header: 'Priority',
      minWidth: 120,
      render: (row) => <StatusChip value={row.priority} />,
    },
    {
      id: 'totalWeight',
      header: 'Weight',
      minWidth: 120,
      nowrap: true,
      render: (row) => formatWeight(row.totalWeight),
    },
    {
      id: 'actions',
      header: 'Actions',
      minWidth: 120,
      align: 'right',
      render: (row) => (
        <Button
          variant="text"
          size="small"
          onClick={() => navigate(`/transport-orders/${row.id}`)}
        >
          Details
        </Button>
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
      emptyTitle="No transport orders found"
      emptyDescription="There are no transport orders that match the current filters."
      minWidth={1600}
    />
  );
}