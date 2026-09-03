import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid, Typography } from '@mui/material';
import { EntityDetailsLayout, DetailsField, DetailsOverviewCard } from '../../../shared/components/EntityDetails';
import { ChangeHistoryPanel } from '../../../shared/components/OperationalPanels';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import { useRole } from '../hooks/useRole';
import { parsePositiveIntegerId } from '../../../core/utils/routeParams';

type RoleDetailsTab = 'overview' | 'changeHistory';

function normalizeRoleName(name: string) {
  return name.replace(/^ROLE_/, '').replaceAll('_', ' ');
}

export default function RoleDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const validRoleId = parsePositiveIntegerId(params.id);
  const [activeTab, setActiveTab] = useState<RoleDetailsTab>('overview');

  const roleQuery = useRole(validRoleId);

  if (validRoleId == null) {
    return <ErrorState title="Role unavailable" description="The requested role could not be found." />;
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
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      title={normalizeRoleName(role.name)}
      breadcrumbs={[{ label: 'Roles', to: '/roles' }, { label: normalizeRoleName(role.name) }]}
      actionItems={[
        { key: 'history', label: 'View history', onClick: () => setActiveTab('changeHistory') },
        { key: 'back', label: 'Back to list', onClick: () => navigate('/roles') },
      ]}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as RoleDetailsTab)}
    >
      {activeTab === 'overview' ? (
        <DetailsOverviewCard title="Role overview" description="Role name and access summary.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}><DetailsField label="ID" value={role.id} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><DetailsField label="System name" value={role.name} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><DetailsField label="Display label" value={normalizeRoleName(role.name)} /></Grid>
            <Grid size={{ xs: 12 }}><DetailsField label="Description" value={role.description || '—'} /></Grid>
          </Grid>
        </DetailsOverviewCard>
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
