import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import { useRoles } from '../hooks/useRoles';
import type { RoleResponse } from '../types/role.types';

export default function RolesPage() {
  const rolesQuery = useRoles();

  const columns: DataTableColumn<RoleResponse>[] = [
    {
      id: 'name',
      header: 'Role',
      minWidth: 220,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {row.id}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      minWidth: 360,
      render: (row) => row.description || '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      minWidth: 140,
      align: 'right',
      render: (row) => (
        <Button
          component={RouterLink}
          to={`/roles/${row.id}`}
          size="small"
          variant="outlined"
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Security"
        title="Roles"
        description="Read-only role catalog based on the real backend role endpoints."
      />

      <SectionCard
        title="Role list"
        description="Roles stay system-defined in the backend. This screen is for inspection, not editing."
      >
        <DataTable<RoleResponse>
          rows={rolesQuery.data ?? []}
          columns={columns}
          loading={rolesQuery.isLoading}
          error={rolesQuery.isError}
          onRetry={() => void rolesQuery.refetch()}
          getRowId={(row) => row.id}
        />
      </SectionCard>
    </Stack>
  );
}
