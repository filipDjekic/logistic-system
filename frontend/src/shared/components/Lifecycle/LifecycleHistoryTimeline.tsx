import { Chip, Stack, Typography } from '@mui/material';
import { buildSortParam } from '../../../core/api/pagination';
import { useChangeHistory } from '../../../features/change-history/hooks/useChangeHistory';
import { AuditTimeline } from '../AuditTimeline';
import RelatedDataSection from '../EntityDetails/RelatedDataSection';

type LifecycleHistoryTimelineProps = {
  entityName: string;
  entityId: number | null;
  title?: string;
};

export default function LifecycleHistoryTimeline({ entityName, entityId, title = 'Lifecycle transition history' }: LifecycleHistoryTimelineProps) {
  const query = useChangeHistory(
    {
      entityName,
      entityId,
      changeType: 'STATUS_CHANGE',
      page: 0,
      size: 20,
      sort: buildSortParam({ field: 'changedAt', direction: 'desc' }),
    },
    Boolean(entityName && entityId),
  );

  const rows = query.data?.content ?? [];

  return (
    <RelatedDataSection
      title={title}
      loading={query.isLoading}
      error={query.isError}
      onRetry={() => { void query.refetch(); }}
      empty={!query.isLoading && !query.isError && rows.length === 0}
      emptyTitle="No lifecycle transitions"
      emptyDescription="No status transitions have been recorded for this entity yet."
    >
      <Stack spacing={2}>
        <AuditTimeline
          items={rows.map((row) => ({
            id: row.id,
            type: row.changeType,
            title: `${row.oldValue ?? '—'} → ${row.newValue ?? '—'}`,
            description: row.fieldName ? `Field: ${row.fieldName}` : null,
            actorName: `User #${row.userId}`,
            metadata: <Chip size="small" variant="outlined" label={row.entityIdentifier ? `${row.entityName} · ${row.entityIdentifier}` : `${row.entityName} #${row.entityId}`} />,
          }))}
        />
        <Typography variant="caption" color="text.secondary">
          Reason text is visible in lifecycle activity/domain events when the backend stores it as operational audit description.
        </Typography>
      </Stack>
    </RelatedDataSection>
  );
}
