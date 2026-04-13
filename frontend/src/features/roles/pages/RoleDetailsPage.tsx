import { useNavigate, useParams } from 'react-router-dom';
import { Button, Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import { useRole } from '../hooks/useRole';

export default function RoleDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const roleId = Number(params.id);

  const roleQuery = useRole(Number.isFinite(roleId) ? roleId : null);

  if (!Number.isFinite(roleId)) {
    return (
      <ErrorState
        title="Invalid role"
        description="The role ID in the route is not valid."
      />
    );
  }

  if (roleQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Security"
          title="Role Details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/roles')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading role details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (roleQuery.isError || !roleQuery.data) {
    return (
      <ErrorState
        title="Role could not be loaded"
        description="The requested role details are not available."
        onRetry={() => void roleQuery.refetch()}
      />
    );
  }

  const role = roleQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Security"
        title={role.name}
        description={`Role #${role.id}`}
        actions={
          <Button variant="outlined" onClick={() => navigate('/roles')}>
            Back to list
          </Button>
        }
      />

      <SectionCard title="Role information">
        <Stack spacing={1.5}>
          <Typography variant="body2">
            <strong>ID:</strong> {role.id}
          </Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {role.name}
          </Typography>
          <Typography variant="body2">
            <strong>Description:</strong> {role.description || '—'}
          </Typography>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
