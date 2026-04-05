import { Button, Stack, Typography } from '@mui/material';
import type { DataTableColumn } from '../../../shared/types/common.types';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { ShiftEmployeeOption, ShiftResponse } from '../types/shift.types';
import ShiftStatusChip from './ShiftStatusChip';

type ShiftsTableProps = {
  rows: ShiftResponse[];
  employeesById?: Record<number, ShiftEmployeeOption>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: (shift: ShiftResponse) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showEmployeeColumn?: boolean;
  showActions?: boolean;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function ShiftsTable({
  rows,
  employeesById,
  loading = false,
  error = false,
  onRetry,
  onEdit,
  emptyTitle,
  emptyDescription,
  showEmployeeColumn = true,
  showActions = false,
}: ShiftsTableProps) {
  const columns: DataTableColumn<ShiftResponse>[] = [
    ...(showEmployeeColumn
      ? [
          {
            id: 'employee',
            header: 'Employee',
            minWidth: 220,
            render: (row: ShiftResponse) => {
              const employee = employeesById?.[row.employeeId];

              if (!employee) {
                return <Typography variant="body2">Employee #{row.employeeId}</Typography>;
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
        ]
      : []),
    {
      id: 'startTime',
      header: 'Start',
      minWidth: 180,
      nowrap: true,
      render: (row) => formatDateTime(row.startTime),
    },
    {
      id: 'endTime',
      header: 'End',
      minWidth: 180,
      nowrap: true,
      render: (row) => formatDateTime(row.endTime),
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <ShiftStatusChip value={row.status} />,
    },
    {
      id: 'notes',
      header: 'Notes',
      minWidth: 240,
      render: (row) => row.notes?.trim() || '—',
    },
    ...(showActions
      ? [
          {
            id: 'actions',
            header: 'Actions',
            align: 'right' as const,
            minWidth: 120,
            render: (row: ShiftResponse) => (
              <Button
                variant="text"
                size="small"
                onClick={() => onEdit?.(row)}
                disabled={row.status !== 'PLANNED'}
              >
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      minWidth={showEmployeeColumn ? 980 : 760}
    />
  );
}