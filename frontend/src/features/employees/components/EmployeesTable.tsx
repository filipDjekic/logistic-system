import type { ReactNode } from 'react';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { formatSalary } from '../../../core/utils/formatSalary';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
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
  pagination?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
};


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
  pagination,
  sort,
  onSortChange,
}: EmployeesTableProps) {
  const navigate = useNavigate();
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
      sortField: 'employmentDate',
      header: 'Employment date',
      minWidth: 150,
      nowrap: true,
      render: (row) => row.employmentDate,
    },
    {
      id: 'salary',
      sortField: 'salary',
      header: 'Salary',
      minWidth: 140,
      nowrap: true,
      align: 'right',
      render: (row) => formatSalary(row.salary, row.salaryCurrencyCode),
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
      sticky: 'right',
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
      pagination={pagination}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={(row) => navigate(`/employees/${row.id}`)}
      rowClickLabel="Open details"
    />
  );
}
