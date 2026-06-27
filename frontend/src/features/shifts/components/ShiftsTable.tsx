import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { DataTableColumn } from '../../../shared/types/common.types';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { ShiftEmployeeOption, ShiftResponse } from '../types/shift.types';
import ShiftStatusChip from './ShiftStatusChip';
import { formatTemporalView } from '../../../core/utils/timezoneFormat';
import { isShiftCancellable, isShiftEditable } from '../utils/shiftLifecycle';

type ShiftsTableProps = {
  rows: ShiftResponse[];
  employeesById?: Record<number, ShiftEmployeeOption>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: (shift: ShiftResponse) => void;
  onCancel?: (shift: ShiftResponse) => void;
  cancelLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showEmployeeColumn?: boolean;
  showActions?: boolean;
  showDetailsAction?: boolean;
};


export default function ShiftsTable({
  rows,
  employeesById,
  loading = false,
  error = false,
  onRetry,
  onEdit,
  onCancel,
  cancelLoading = false,
  emptyTitle,
  emptyDescription,
  showEmployeeColumn = true,
  showActions = false,
  showDetailsAction = false,
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
      render: (row) => formatTemporalView(row.startTimeView, row.startTime),
    },
    {
      id: 'endTime',
      header: 'End',
      minWidth: 180,
      nowrap: true,
      render: (row) => formatTemporalView(row.endTimeView, row.endTime),
    },
    {
      id: 'warehouse',
      header: 'Warehouse',
      minWidth: 180,
      render: (row) => row.warehouseName ?? (row.warehouseId ? `Warehouse #${row.warehouseId}` : '—'),
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
    ...(showActions || showDetailsAction
      ? [
          {
            id: 'actions',
            header: 'Actions',
            align: 'right' as const,
            minWidth: 180,
            render: (row: ShiftResponse) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  component={RouterLink}
                  to={`/shifts/${row.id}`}
                  variant="text"
                  size="small"
                >
                  Open
                </Button>
                {showActions ? (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onEdit?.(row)}
                    disabled={!isShiftEditable(row)}
                  >
                    Edit
                  </Button>
                ) : null}
                {showActions ? (
                  <Button
                    variant="text"
                    color="warning"
                    size="small"
                    onClick={() => onCancel?.(row)}
                    disabled={!isShiftCancellable(row) || cancelLoading}
                  >
                    Cancel
                  </Button>
                ) : null}
              </Stack>
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
      minWidth={showEmployeeColumn ? 1120 : 900}
    />
  );
}