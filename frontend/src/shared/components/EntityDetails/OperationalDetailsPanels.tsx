import type { ComponentProps, ReactNode } from 'react';
import { Chip, Grid } from '@mui/material';
import { useAuthStore, authStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useActivityTimeline } from '../../../features/activity-timeline/hooks/useActivityTimeline';
import type { OperationalEntityType } from '../../../features/activity-timeline/types/activityTimeline.types';
import { AuditTimeline } from '../AuditTimeline';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../OperationalPanels';
import EmptyState from '../EmptyState/EmptyState';
import { DetailsTabPanel } from './DetailsTabs';
import RelatedDataSection from './RelatedDataSection';

type OperationalPanelBaseProps = {
  entityType: OperationalEntityType;
  entityId: number | null;
};

type OperationalTabKey = 'attachments' | 'comments' | 'audit' | 'history' | 'activity';

type AuditTimelinePanelProps = {
  entityName: string;
  entityId: number | null;
  title?: string;
  description?: string;
  search?: string;
};

type ActivityPanelProps = OperationalPanelBaseProps & {
  title?: string;
  description?: string;
};

type OperationalTabDefinition = {
  value: OperationalTabKey;
  label: ReactNode;
  disabled?: boolean;
  render: () => ReactNode;
};

type BuildOperationalTabsParams = OperationalPanelBaseProps & {
  entityName: string;
  entityId: number | null;
  includeAttachments?: boolean;
  includeComments?: boolean;
  includeAudit?: boolean;
  includeHistory?: boolean;
  includeActivity?: boolean;
  allowCreateAttachments?: boolean;
  allowCreateComments?: boolean;
  canViewAudit?: boolean;
  attachmentPanelProps?: Partial<ComponentProps<typeof AttachmentsPanel>>;
  commentsPanelProps?: Partial<ComponentProps<typeof CommentsPanel>>;
  auditPanelProps?: Partial<ComponentProps<typeof ChangeHistoryPanel>>;
};

type OperationalDetailsTabPanelsProps = BuildOperationalTabsParams & {
  activeTab: string;
  labelledByPrefix?: string;
  auditUnavailableTitle?: string;
  auditUnavailableDescription?: string;
};

function ActivityPanel({
  entityType,
  entityId,
  title = 'Activity',
  description = 'Combined operational activity for this entity.',
}: ActivityPanelProps) {
  const query = useActivityTimeline(entityType, entityId);
  const events = query.data ?? [];

  return (
    <RelatedDataSection
      title={title}
      description={description}
      loading={query.isLoading}
      error={query.isError}
      onRetry={() => { void query.refetch(); }}
      empty={!query.isLoading && !query.isError && events.length === 0}
      emptyTitle="No activity"
      emptyDescription="There is no recorded operational activity for this entity yet."
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

function AuditTimelinePanel({ entityName, entityId, title = 'Audit', description, search }: AuditTimelinePanelProps) {
  return <ChangeHistoryPanel entityName={entityName} entityId={entityId} title={title} description={description} search={search} />;
}

function canViewActivityTimeline(): boolean {
  return authStore.getState().user?.role === ROLES.OVERLORD;
}

function buildOperationalTabs({
  entityType,
  entityName,
  entityId,
  includeAttachments = true,
  includeComments = true,
  includeAudit = true,
  includeHistory = true,
  includeActivity = false,
  allowCreateAttachments = true,
  allowCreateComments = true,
  canViewAudit = true,
  attachmentPanelProps,
  commentsPanelProps,
  auditPanelProps,
}: BuildOperationalTabsParams): OperationalTabDefinition[] {
  const tabs: OperationalTabDefinition[] = [];

  if (includeAttachments) {
    tabs.push({
      value: 'attachments',
      label: 'Attachments',
      render: () => <AttachmentsPanel {...attachmentPanelProps} entityType={entityType} entityId={entityId} allowCreate={allowCreateAttachments} />,
    });
  }

  if (includeComments) {
    tabs.push({
      value: 'comments',
      label: 'Comments',
      render: () => <CommentsPanel {...commentsPanelProps} entityType={entityType} entityId={entityId} allowCreate={allowCreateComments} />,
    });
  }

  if (includeAudit) {
    tabs.push({
      value: 'audit',
      label: 'Audit',
      disabled: !canViewAudit,
      render: () => <AuditTimelinePanel {...auditPanelProps} entityName={entityName} entityId={entityId} />,
    });
  }

  if (includeHistory) {
    tabs.push({
      value: 'history',
      label: 'History',
      render: () => <DomainEventsPanel entityType={entityType} entityId={entityId} />,
    });
  }

  if (includeActivity && canViewActivityTimeline()) {
    tabs.push({
      value: 'activity',
      label: 'Activity',
      render: () => <ActivityPanel entityType={entityType} entityId={entityId} />,
    });
  }

  return tabs;
}

function OperationalDetailsTabPanels({
  activeTab,
  entityType,
  entityName,
  entityId,
  includeAttachments = true,
  includeComments = true,
  includeAudit = true,
  includeHistory = true,
  includeActivity = false,
  allowCreateAttachments = true,
  allowCreateComments = true,
  canViewAudit = true,
  attachmentPanelProps,
  commentsPanelProps,
  auditPanelProps,
  labelledByPrefix = 'details-tab',
  auditUnavailableTitle = 'Audit unavailable',
  auditUnavailableDescription = 'Your role cannot view the audit trail for this entity.',
}: OperationalDetailsTabPanelsProps) {
  const auth = useAuthStore();
  const canViewActivity = auth.user?.role === ROLES.OVERLORD;

  return (
    <>
      {includeAttachments ? (
        <DetailsTabPanel value="attachments" activeValue={activeTab} labelledByPrefix={labelledByPrefix}>
          <AttachmentsPanel {...attachmentPanelProps} entityType={entityType} entityId={entityId} allowCreate={allowCreateAttachments} />
        </DetailsTabPanel>
      ) : null}

      {includeComments ? (
        <DetailsTabPanel value="comments" activeValue={activeTab} labelledByPrefix={labelledByPrefix}>
          <CommentsPanel {...commentsPanelProps} entityType={entityType} entityId={entityId} allowCreate={allowCreateComments} />
        </DetailsTabPanel>
      ) : null}

      {includeAudit ? (
        <DetailsTabPanel value="audit" activeValue={activeTab} labelledByPrefix={labelledByPrefix}>
          {canViewAudit ? <AuditTimelinePanel {...auditPanelProps} entityName={entityName} entityId={entityId} /> : <EmptyState title={auditUnavailableTitle} description={auditUnavailableDescription} />}
        </DetailsTabPanel>
      ) : null}

      {includeHistory ? (
        <DetailsTabPanel value="history" activeValue={activeTab} labelledByPrefix={labelledByPrefix}>
          <DomainEventsPanel entityType={entityType} entityId={entityId} />
        </DetailsTabPanel>
      ) : null}

      {includeActivity && canViewActivity ? (
        <DetailsTabPanel value="activity" activeValue={activeTab} labelledByPrefix={labelledByPrefix}>
          <ActivityPanel entityType={entityType} entityId={entityId} />
        </DetailsTabPanel>
      ) : null}
    </>
  );
}

function CommentsAndAttachmentsPanel({
  entityType,
  entityId,
  allowCreateComments = true,
  allowCreateAttachments = true,
}: OperationalPanelBaseProps & { allowCreateComments?: boolean; allowCreateAttachments?: boolean }) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <CommentsPanel entityType={entityType} entityId={entityId} allowCreate={allowCreateComments} />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <AttachmentsPanel entityType={entityType} entityId={entityId} allowCreate={allowCreateAttachments} />
      </Grid>
    </Grid>
  );
}

export {
  ActivityPanel,
  AuditTimelinePanel,
  CommentsAndAttachmentsPanel,
  OperationalDetailsTabPanels,
  buildOperationalTabs,
};
export type {
  ActivityPanelProps,
  AuditTimelinePanelProps,
  BuildOperationalTabsParams,
  OperationalDetailsTabPanelsProps,
  OperationalTabDefinition,
  OperationalTabKey,
};
