import { Chip } from '@mui/material';
import { useActivityTimeline } from '../../../features/activity-timeline/hooks/useActivityTimeline';
import type { OperationalEntityType } from '../../../features/activity-timeline/types/activityTimeline.types';
import { AuditTimeline } from '../AuditTimeline';
import RelatedDataSection from '../EntityDetails/RelatedDataSection';

type DomainEventsPanelProps = {
  entityType: OperationalEntityType;
  entityId: number | null;
};

export default function DomainEventsPanel({ entityType, entityId }: DomainEventsPanelProps) {
  const query = useActivityTimeline(entityType, entityId);
  const events = (query.data ?? []).filter((item) => item.type === 'DOMAIN_EVENT');

  return (
    <RelatedDataSection
      title="Domain events"
      loading={query.isLoading}
      error={query.isError}
      onRetry={() => { void query.refetch(); }}
      empty={!query.isLoading && !query.isError && events.length === 0}
      emptyTitle="No domain events"
      emptyDescription="This entity has no recorded lifecycle domain events yet."
    >
      <AuditTimeline
        items={events.map((event) => ({
          id: `${event.type}-${event.sourceId}`,
          type: event.type,
          title: event.title,
          description: event.description,
          occurredAt: event.occurredAt,
          actorName: event.actorName,
          actorEmail: event.actorEmail,
          metadata: <Chip size="small" variant="outlined" label={`${event.entityType} #${event.entityId}`} />,
        }))}
      />
    </RelatedDataSection>
  );
}
