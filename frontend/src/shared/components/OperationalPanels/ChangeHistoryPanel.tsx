import { Chip } from '@mui/material';
import { buildSortParam } from '../../../core/api/pagination';
import { useChangeHistory } from '../../../features/change-history/hooks/useChangeHistory';
import type { ChangeHistoryResponse } from '../../../features/change-history/types/changeHistory.types';
import { AuditTimeline } from '../AuditTimeline';
import RelatedDataSection from '../EntityDetails/RelatedDataSection';

type ChangeHistoryPanelProps = {
  entityName: string;
  entityId: number | null;
  title?: string;
  search?: string;
  description?: string;
};

function describeChange(change: ChangeHistoryResponse) {
  if (!change.fieldName) {
    return null;
  }

  return `${change.fieldName}: ${change.oldValue ?? '—'} → ${change.newValue ?? '—'}`;
}

export default function ChangeHistoryPanel({ entityName, entityId, title = 'Change history', search = '', description = 'Business audit trail for changes made to this entity.' }: ChangeHistoryPanelProps) {
  const query = useChangeHistory(
    {
      search: search.trim(),
      entityName,
      entityId,
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
      description={description}
      loading={query.isLoading}
      error={query.isError}
      onRetry={() => { void query.refetch(); }}
      empty={!query.isLoading && !query.isError && rows.length === 0}
      emptyTitle="No change history"
      emptyDescription="No changes have been recorded for this entity yet."
    >
      <AuditTimeline
        items={rows.map((row) => ({
          id: row.id,
          type: row.changeType,
          title: row.fieldName ? `Changed ${row.fieldName}` : `${row.changeType} ${row.entityName}`,
          description: describeChange(row),
          actorName: `User #${row.userId}`,
          metadata: <Chip size="small" variant="outlined" label={row.entityIdentifier ? `${row.entityName} #${row.entityId} · ${row.entityIdentifier}` : `${row.entityName} #${row.entityId}`} />,
        }))}
      />
    </RelatedDataSection>
  );
}
