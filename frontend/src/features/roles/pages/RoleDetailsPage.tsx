import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chip, Grid, Stack, Typography } from '@mui/material';
import { EntityDetailsLayout, DetailsField, DetailsOverviewCard } from '../../../shared/components/EntityDetails';
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
      <EntityDetailsLayout overline="Security" title="Role Details" actionItems={[{ key: 'back', label: 'Back to list', to: '/roles' }]}>
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
      title={normalizeRoleName(role.name)}
      breadcrumbs={[{ label: 'Roles', to: '/roles' }, { label: normalizeRoleName(role.name) }]}
      hero={{
        overline: 'Security',
        title: normalizeRoleName(role.name),
        subtitle: `Role #${role.id} • ${role.name}`,
        primaryInfo: [
          { label: 'System name', value: role.name },
          { label: 'Display label', value: normalizeRoleName(role.name) },
        ],
      }}
      actionItems={[
        { key: 'history', label: 'View history', onClick: () => setActiveTab('changeHistory') },
        { key: 'back', label: 'Back to list', onClick: () => navigate('/roles') },
      ]}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as RoleDetailsTab)}
    >
      {activeTab === 'overview' ? (
        <DetailsOverviewCard title="Role overview" description="Role identity used by authorization guards and access checks.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}><DetailsField label="ID" value={role.id} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><DetailsField label="System name" value={role.name} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><DetailsField label="Display label" value={normalizeRoleName(role.name)} /></Grid>
            <Grid size={{ xs: 12 }}><DetailsField label="Description" value={role.description || '—'} /></Grid>
          </Grid>
        </DetailsOverviewCard>
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
