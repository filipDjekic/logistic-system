import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DetailsActionBar, { type DetailsAction } from './DetailsActionBar';
import SectionCard from '../SectionCard/SectionCard';
import { LifecycleHistoryTimeline } from '../Lifecycle';
import StatusChip from '../StatusChip/StatusChip';

type DetailsLifecycleCardProps<TStatus extends string = string> = {
  title?: string;
  description?: string;
  currentStatus: TStatus;
  statusNode?: ReactNode;
  statusDescription?: ReactNode;
  statuses?: readonly TStatus[];
  allowedNextStatuses?: readonly TStatus[];
  terminalStatuses?: readonly TStatus[];
  actions?: DetailsAction[];
  actionsTitle?: string;
  noActionsText?: string;
  warning?: ReactNode;
  info?: ReactNode;
  historyEntityName?: string;
  historyEntityId?: number | null;
  historyTitle?: string;
  children?: ReactNode;
};

function renderTextBlock(value: ReactNode) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return (
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    );
  }

  return value;
}

export default function DetailsLifecycleCard<TStatus extends string = string>({
  title = 'Lifecycle',
  description = 'Backend-controlled status workflow for this entity.',
  currentStatus,
  statusNode,
  statusDescription,
  allowedNextStatuses = [],
  terminalStatuses = [],
  actions = [],
  actionsTitle = 'Available actions',
  noActionsText = 'No lifecycle action is currently available for your role and this status.',
  warning,
  info,
  historyEntityName,
  historyEntityId,
  historyTitle,
  children,
}: DetailsLifecycleCardProps<TStatus>) {
  const hasActions = actions.length > 0;
  const isTerminal = terminalStatuses.includes(currentStatus);
  const hasAllowedNextStatuses = allowedNextStatuses.length > 0;
  const hasExpandableDetails = Boolean(children || (historyEntityName && historyEntityId));

  return (
    <SectionCard title={title} description={description}>
      <Stack spacing={2}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: hasActions ? 'minmax(0, 1fr) auto' : '1fr' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Stack spacing={1.25} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                Current status
              </Typography>
              {statusNode ?? <StatusChip value={currentStatus} />}
              {isTerminal ? <Chip size="small" variant="outlined" label="Terminal" /> : null}
            </Stack>

            {renderTextBlock(statusDescription)}
          </Stack>

          {hasActions ? (
            <Stack spacing={0.75} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {actionsTitle}
              </Typography>
              <DetailsActionBar actions={actions} align="end" dense />
            </Stack>
          ) : null}
        </Box>

        {info ? <Alert severity="info">{info}</Alert> : null}
        {warning ? <Alert severity="warning">{warning}</Alert> : null}

        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={800}>
            Allowed transitions
          </Typography>
          {hasAllowedNextStatuses ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {allowedNextStatuses.map((status) => (
                <StatusChip key={status} value={status} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {noActionsText}
            </Typography>
          )}
        </Stack>

        {hasExpandableDetails ? (
          <>
            <Divider />
            <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Lifecycle details
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Stack spacing={2}>
                  {children}
                  {historyEntityName && historyEntityId ? (
                    <LifecycleHistoryTimeline entityName={historyEntityName} entityId={historyEntityId} title={historyTitle} />
                  ) : null}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </>
        ) : null}
      </Stack>
    </SectionCard>
  );
}

export type { DetailsLifecycleCardProps };
