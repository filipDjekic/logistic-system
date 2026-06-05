import { memo, type ReactNode } from 'react';
import { Box, Chip, Divider, Link, Stack, Typography } from '@mui/material';
import EmptyState from '../EmptyState/EmptyState';

type AuditTimelineItem = {
  id: string | number;
  type: string;
  title: string;
  description?: ReactNode;
  occurredAt?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  metadata?: ReactNode;
};

type AuditTimelineProps = {
  items: AuditTimelineItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

function AuditTimeline({
  items,
  emptyTitle = 'No activity found',
  emptyDescription = 'There are no audit timeline records for this context yet.',
}: AuditTimelineProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Stack spacing={1.5}>
      {items.map((item, index) => (
        <Box
          key={item.id}
          sx={{
            position: 'relative',
            pl: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 6,
              top: 8,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'primary.main',
            },
            '&::after': index === items.length - 1 ? undefined : {
              content: '""',
              position: 'absolute',
              left: 10.5,
              top: 24,
              bottom: -12,
              borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip size="small" label={item.type} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(item.occurredAt)}
              </Typography>
              {item.metadata}
            </Stack>

            <Typography variant="body2" fontWeight={800}>{item.title}</Typography>

            {item.description ? (
              <Typography variant="body2" color="text.secondary" component="div">
                {item.description}
              </Typography>
            ) : null}

            <Divider />

            <Typography variant="caption" color="text.secondary">
              {item.actorName ?? 'System'}
              {item.actorEmail ? <> · <Link href={`mailto:${item.actorEmail}`}>{item.actorEmail}</Link></> : null}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export default memo(AuditTimeline);
