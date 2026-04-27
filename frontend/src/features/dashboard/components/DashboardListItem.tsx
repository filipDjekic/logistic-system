import type { ReactNode } from 'react';
import { alpha, Box, Chip, Stack, Typography } from '@mui/material';

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  status?: string | null;
  priority?: string | null;
};

function getStatusTone(status: string | null | undefined): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const normalized = status?.toUpperCase();

  if (!normalized) return 'default';
  if (['COMPLETED', 'DELIVERED', 'ACTIVE', 'AVAILABLE', 'DONE'].includes(normalized)) return 'success';
  if (['NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'IN_TRANSIT'].includes(normalized)) return 'info';
  if (['LOW_STOCK', 'MAINTENANCE', 'PENDING'].includes(normalized)) return 'warning';
  if (['CANCELLED', 'INACTIVE', 'OUT_OF_SERVICE', 'FAILED'].includes(normalized)) return 'error';

  return 'default';
}

export default function DashboardListItem({ title, subtitle, meta, status, priority }: Props) {
  const tone = getStatusTone(status);

  return (
    <Box
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.55 : 0.85),
        borderLeft: status ? `3px solid ${theme.palette[tone === 'default' ? 'primary' : tone].main}` : undefined,
      })}
    >
      <Stack spacing={0.75}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2">{title}</Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {status ? <Chip size="small" label={status} color={tone === 'default' ? 'default' : tone} /> : null}
            {priority ? <Chip size="small" label={priority} variant="outlined" /> : null}
          </Stack>
        </Stack>

        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}

        {meta ? (
          <Typography variant="caption" color="text.secondary">
            {meta}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
