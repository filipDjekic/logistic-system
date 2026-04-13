import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import type { CompanyResponse } from '../types/company.types';

type CompaniesTableProps = {
  rows: CompanyResponse[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onEdit?: (company: CompanyResponse) => void;
};

export default function CompaniesTable({
  rows,
  loading = false,
  error = false,
  onRetry,
  onEdit,
}: CompaniesTableProps) {
  const columns: DataTableColumn<CompanyResponse>[] = [
    {
      id: 'id',
      header: 'ID',
      minWidth: 80,
      nowrap: true,
      render: (row) => row.id,
    },
    {
      id: 'name',
      header: 'Company',
      minWidth: 260,
      render: (row) => (
        <Typography variant="body2" fontWeight={700}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'bootstrapAdmin',
      header: 'Bootstrap admin',
      minWidth: 260,
      render: (row) =>
        row.adminFullName || row.adminEmail ? (
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600}>
              {row.adminFullName ?? '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.adminEmail ?? '—'}
            </Typography>
          </Stack>
        ) : (
          '—'
        ),
    },
    {
      id: 'active',
      header: 'Status',
      minWidth: 140,
      render: (row) => (row.active ? 'Active' : 'Inactive'),
    },
    {
      id: 'createdAt',
      header: 'Created',
      minWidth: 180,
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            component={RouterLink}
            to={`/companies/${row.id}`}
            variant="text"
            size="small"
          >
            Details
          </Button>

          <Button variant="text" size="small" onClick={() => onEdit?.(row)}>
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
      emptyTitle="No companies found"
      emptyDescription="There are no companies in the system yet."
      minWidth={1100}
    />
  );
}
