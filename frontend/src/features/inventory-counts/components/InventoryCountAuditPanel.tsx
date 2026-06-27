import { useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import DomainEventsPanel from '../../../shared/components/OperationalPanels/DomainEventsPanel';
import ChangeHistoryPanel from '../../../shared/components/OperationalPanels/ChangeHistoryPanel';
import AttachmentsPanel from '../../../shared/components/OperationalPanels/AttachmentsPanel';
import LifecycleHistoryTimeline from '../../../shared/components/Lifecycle/LifecycleHistoryTimeline';

type Props = {
  sessionId: number;
  code: string;
  allowAttachmentsCreate?: boolean;
};

type LazyAuditSectionProps = {
  id: string;
  title: string;
  description: string;
  expandedSection: string | null;
  visitedSections: Set<string>;
  onToggle: (id: string, expanded: boolean) => void;
  children: ReactNode;
};

function LazyAuditSection({
  id,
  title,
  description,
  expandedSection,
  visitedSections,
  onToggle,
  children,
}: LazyAuditSectionProps) {
  const expanded = expandedSection === id;
  const shouldMount = visitedSections.has(id);

  return (
    <Accordion
      disableGutters
      variant="outlined"
      expanded={expanded}
      onChange={(_, nextExpanded) => onToggle(id, nextExpanded)}
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {shouldMount ? children : null}
      </AccordionDetails>
    </Accordion>
  );
}

export default function InventoryCountAuditPanel({ sessionId, code, allowAttachmentsCreate = false }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(() => new Set());

  const handleToggle = (sectionId: string, expanded: boolean) => {
    setExpandedSection(expanded ? sectionId : null);
    if (expanded) {
      setVisitedSections((previous) => {
        if (previous.has(sectionId)) return previous;
        const next = new Set(previous);
        next.add(sectionId);
        return next;
      });
    }
  };

  return (
    <Stack spacing={1.5}>
      <LazyAuditSection
        id="lifecycle-history"
        title="Lifecycle history"
        description="Status transition history. Loaded only after this section is opened."
        expandedSection={expandedSection}
        visitedSections={visitedSections}
        onToggle={handleToggle}
      >
        <LifecycleHistoryTimeline
          entityName="INVENTORY_COUNT"
          entityId={sessionId}
          title="Inventory count lifecycle history"
        />
      </LazyAuditSection>

      <LazyAuditSection
        id="domain-events"
        title="Domain events"
        description="Operational lifecycle events emitted for this count session. Loaded on demand."
        expandedSection={expandedSection}
        visitedSections={visitedSections}
        onToggle={handleToggle}
      >
        <DomainEventsPanel entityType="INVENTORY_COUNT" entityId={sessionId} />
      </LazyAuditSection>

      <LazyAuditSection
        id="change-history"
        title="Change history"
        description="Business audit trail for status changes, review decisions and adjustment creation. Loaded on demand."
        expandedSection={expandedSection}
        visitedSections={visitedSections}
        onToggle={handleToggle}
      >
        <ChangeHistoryPanel
          entityName="INVENTORY_COUNT"
          entityId={sessionId}
          search={code}
          title="Inventory count audit trail"
          description="Business audit trail for count status changes, review decisions and adjustment creation."
        />
      </LazyAuditSection>

      <LazyAuditSection
        id="attachments"
        title="Attachments"
        description="Documents and evidence linked to this inventory count. Loaded on demand."
        expandedSection={expandedSection}
        visitedSections={visitedSections}
        onToggle={handleToggle}
      >
        <AttachmentsPanel
          entityType="INVENTORY_COUNT"
          entityId={sessionId}
          allowCreate={allowAttachmentsCreate}
          title="Inventory count attachments"
          description="Documents and evidence connected with this inventory count. Upload stores the file and keeps the audit trail."
          defaultAttachmentType="REPORT"
        />
      </LazyAuditSection>
    </Stack>
  );
}
