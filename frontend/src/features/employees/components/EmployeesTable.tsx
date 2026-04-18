import { Button, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { EmployeeResponse, EmployeeUserOption } from '../types/employee.types';

type EmployeesTableProps = {
  rows: EmployeeResponse[];
  usersById: Record<number, EmployeeUserOption>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: (employee: EmployeeResponse) => void;
  canEdit?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function EmployeesTable({
  rows,
  usersById,
  loading = false,
  error = false,
  onRetry,
  onEdit,
  canEdit = false,
  emptyTitle,
  emptyDescription,
}: EmployeesTableProps) {
  const columns: DataTableColumn<EmployeeResponse>[] = [
    {
      id: 'employee',
      header: 'Employee',
      minWidth: 240,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {row.firstName} {row.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'position',
      header: 'Role',
      minWidth: 180,
      render: (row) => row.position,
    },
    {
      id: 'jmbg',
      header: 'JMBG',
      minWidth: 150,
      nowrap: true,
      render: (row) => row.jmbg,
    },
    {
      id: 'phoneNumber',
      header: 'Phone',
      minWidth: 150,
      nowrap: true,
      render: (row) => row.phoneNumber,
    },
    {
      id: 'employmentDate',
      header: 'Employment date',
      minWidth: 150,
      nowrap: true,
      render: (row) => row.employmentDate,
    },
    {
      id: 'salary',
      header: 'Salary',
      minWidth: 140,
      nowrap: true,
      align: 'right',
      render: (row) => formatCurrency(row.salary),
    },
    {
      id: 'access',
      header: 'Access',
      minWidth: 220,
      render: (row) => {
        if (!row.userId) {
          return <Chip size="small" label="No account" />;
        }

        const user = usersById[row.userId];

        if (!user) {
          return <Chip size="small" label={`User #${row.userId}`} />;
        }

        return (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {user.enabled ? 'Enabled' : 'Disabled'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.status}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      minWidth: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button component={RouterLink} to={`/employees/${row.id}`} variant="text" size="small">
            Details
          </Button>

          {canEdit ? (
            <Button variant="text" size="small" onClick={() => onEdit?.(row)}>
              Edit
            </Button>
          ) : null}
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
      emptyTitle={emptyTitle ?? 'No employees found'}
      emptyDescription={
        emptyDescription ?? 'There are no employees for the current filter combination.'
      }
      minWidth={1320}
    />
  );
}
