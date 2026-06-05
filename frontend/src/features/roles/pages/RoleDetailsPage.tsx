import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { EntityDetailsLayout } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import { useRole } from '../hooks/useRole';

type RoleDetailsTab = 'overview' | 'permissions' | 'changeHistory';

function normalizeRoleName(name: string) {
  return name.replace(/^ROLE_/, '').replaceAll('_', ' ');
}

export default function RoleDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const roleId = Number(params.id);
  const [activeTab, setActiveTab] = useState<RoleDetailsTab>('overview');

  const roleQuery = useRole(Number.isFinite(roleId) ? roleId : null);

  if (!Number.isFinite(roleId)) {
    return <ErrorState title="Invalid role" description="The role ID in the route is not valid." />;
  }

  if (roleQuery.isLoading) {
    return (
      <EntityDetailsLayout overline="Security" title="Role Details" actions={<Button variant="outlined" onClick={() => navigate('/roles')}>Back to list</Button>}>
        <SectionCard><Typography color="text.secondary">Loading role details...</Typography></SectionCard>
      </EntityDetailsLayout>
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
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'permissions', label: 'Permission model' },
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Security"
      title={normalizeRoleName(role.name)}
      description={`Role #${role.id} • ${role.name}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as RoleDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={() => setActiveTab('changeHistory')}>View history</Button>
          <Button variant="outlined" onClick={() => navigate('/roles')}>Back to list</Button>
        </Stack>
      }
    >
      {activeTab === 'overview' ? (
        <SectionCard title="Role overview" description="Role identity used by authorization guards and access checks.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">ID</Typography>
              <Typography fontWeight={700}>{role.id}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">System name</Typography>
              <Typography fontWeight={700}>{role.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary">Display label</Typography>
              <Typography fontWeight={700}>{normalizeRoleName(role.name)}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography>{role.description || '—'}</Typography>
            </Grid>
          </Grid>
        </SectionCard>
      ) : null}

      {activeTab === 'permissions' ? (
        <SectionCard title="Permission model" description="Role is consumed by backend authorization and frontend operation guards.">
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={role.name} />
              <Chip variant="outlined" label="Navigation access" />
              <Chip variant="outlined" label="Operation guards" />
              <Chip variant="outlined" label="Warehouse access checks" />
            </Stack>
            <Typography color="text.secondary">
              Detailed permissions are enforced through role-based guards in API endpoints and page-level UI checks. This tab keeps the role lifecycle consistent with other details pages without duplicating static permission code into the database.
            </Typography>
          </Stack>
        </SectionCard>
      ) : null}

      {activeTab === 'changeHistory' ? (
        <ChangeHistoryPanel
          entityName="ROLE"
          entityId={role.id}
          title="Role change history"
          description="Audit trail for changes made to this role record."
        />
      ) : null}
    </EntityDetailsLayout>
  );
}
