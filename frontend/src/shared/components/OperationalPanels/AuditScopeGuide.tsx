import { Alert, Stack } from '@mui/material';

type AuditScopeGuideProps = {
  mode: 'change-history' | 'activity-timeline' | 'activity-logs';
};

const copy = {
  'change-history': {
    severity: 'info' as const,
    title: 'Change History is the user-facing audit trail for entity field changes. Use it to see who changed a record, which field changed, and the before/after value.',
  },
  'activity-timeline': {
    severity: 'success' as const,
    title: 'Activity Timeline is the operational story of an entity. It combines domain events, comments and attachments; it does not expose raw system activity logs.',
  },
  'activity-logs': {
    severity: 'warning' as const,
    title: 'Activity Logs are OVERLORD-only system audit records. They are for administration, security review and troubleshooting, not for normal operational users.',
  },
};

export default function AuditScopeGuide({ mode }: AuditScopeGuideProps) {
  const item = copy[mode];

  return (
    <Stack spacing={1}>
      <Alert severity={item.severity}>{item.title}</Alert>
    </Stack>
  );
}
