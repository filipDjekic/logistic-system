import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getEntityDetailsPath } from '../../../core/utils/entityRoutes';
import { AuditTimeline } from '../../../shared/components/AuditTimeline';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import { AttachmentsPanel, AuditScopeGuide, CommentsPanel } from '../../../shared/components/OperationalPanels';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import {
  useActivityTimeline,
  useRecentActivityTimeline,
} from '../hooks/useActivityTimeline';
import type { ActivityTimelineItem, OperationalEntityType } from '../types/activityTimeline.types';

const entityTypes: OperationalEntityType[] = [
  'TRANSPORT_ORDER',
  'TASK',
  'WAREHOUSE',
  'WAREHOUSE_INVENTORY',
  'STOCK_MOVEMENT',
  'SHIFT',
  'EMPLOYEE',
  'VEHICLE',
  'VEHICLE_MAINTENANCE',
  'PRODUCT',
  'COMPANY',
  'GENERAL',
];

type ActivityTab = 'recent' | 'entity' | 'commentsAttachments';

function mapTimelineItems(items: ActivityTimelineItem[]) {
  return items.map((item) => ({
    id: `${item.type}-${item.sourceId}-${item.occurredAt}`,
    type: item.type,
    title: item.title,
    description: item.description,
    occurredAt: item.occurredAt,
    actorName: item.actorName,
    actorEmail: item.actorEmail,
    metadata: <Chip size="small" variant="outlined" label={`${item.entityType} #${item.entityId}`} />,
  }));
}

function countByType(items: ActivityTimelineItem[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});
}

export default function ActivityTimelinePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActivityTab>('recent');
  const [entityType, setEntityType] = useState<OperationalEntityType>('TRANSPORT_ORDER');
  const [entityId, setEntityId] = useState<number | null>(null);

  const timelineQuery = useActivityTimeline(entityType, entityId, activeTab === 'entity');
  const recentQuery = useRecentActivityTimeline(activeTab === 'recent');

  const selectedEntityPath = getEntityDetailsPath({ entityType, entityId });
  const recentItems = recentQuery.data ?? [];
  const entityItems = timelineQuery.data ?? [];
  const currentItems = activeTab === 'entity' ? entityItems : recentItems;
  const currentCounts = useMemo(() => countByType(currentItems), [currentItems]);
  const currentTimelineItems = useMemo(() => mapTimelineItems(currentItems), [currentItems]);
  const entitySelected = Boolean(entityType && entityId);

  return (
    <EntityDetailsLayout
      overline="Operations"
      title="Activity timeline"
      tabs={[
        { value: 'recent', label: 'Recent activity' },
        { value: 'entity', label: 'Entity timeline' },
        { value: 'commentsAttachments', label: 'Comments & attachments', disabled: !entitySelected },
      ]}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as ActivityTab)}
      actions={
        selectedEntityPath ? (
          <Button variant="outlined" onClick={() => navigate(selectedEntityPath)}>
            Open selected entity
          </Button>
        ) : undefined
      }
    >
      <AuditScopeGuide mode="activity-timeline" />

      <SectionCard title="Entity context" description="Use this selector when you need the full operational thread for one concrete entity.">
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              select
              label="Entity type"
              fullWidth
              value={entityType}
              onChange={(event) => setEntityType(event.target.value as OperationalEntityType)}
            >
              {entityTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Entity ID"
              type="number"
              fullWidth
              value={entityId ?? ''}
              onChange={(event) => setEntityId(event.target.value ? Number(event.target.value) : null)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity={entitySelected ? 'success' : 'info'}>
              {entitySelected ? `Selected ${entityType} #${entityId}` : 'Recent activity is shown until an entity ID is selected.'}
            </Alert>
          </Grid>
        </Grid>
      </SectionCard>

      {activeTab === 'recent' || activeTab === 'entity' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionCard title="Activity summary" description="Counts for the currently visible timeline.">
              {Object.keys(currentCounts).length === 0 ? (
                <Typography color="text.secondary">No activity summary yet.</Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {Object.entries(currentCounts).map(([type, count]) => (
                    <Chip key={type} label={`${type}: ${count}`} />
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <RelatedDataSection
              title={activeTab === 'entity' ? 'Entity operational timeline' : 'Recent domain events'}
              description={activeTab === 'entity' ? 'Domain events, comments and attachments for the selected entity.' : 'Newest domain events across accessible entities. Raw activity logs are excluded.'}
              loading={activeTab === 'entity' ? timelineQuery.isLoading : recentQuery.isLoading}
              error={activeTab === 'entity' ? timelineQuery.isError : recentQuery.isError}
              onRetry={() => {
                if (activeTab === 'entity') {
                  void timelineQuery.refetch();
                } else {
                  void recentQuery.refetch();
                }
              }}
              empty={entitySelected || activeTab === 'recent' ? !(activeTab === 'entity' ? timelineQuery.isLoading : recentQuery.isLoading) && currentItems.length === 0 : false}
              emptyTitle="No activity found"
              emptyDescription="There are no operational records for the current context."
            >
              {activeTab === 'entity' && !entitySelected ? (
                <Alert severity="info">Select entity type and entity ID to load the entity timeline.</Alert>
              ) : (
                <AuditTimeline items={currentTimelineItems} />
              )}
            </RelatedDataSection>
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <CommentsPanel entityType={entityType} entityId={entityId} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AttachmentsPanel entityType={entityType} entityId={entityId} />
          </Grid>
        </Grid>
      ) : null}
    </EntityDetailsLayout>
  );
}
