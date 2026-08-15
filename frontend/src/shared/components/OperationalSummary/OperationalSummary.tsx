import type { ReactNode } from 'react';
import { alpha, Box, Grid, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import StatusChip from '../StatusChip/StatusChip';

export function MetadataField({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
      {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
    </Box>
  );
}

export function MetadataGrid({ children }: { children: ReactNode }) {
  return <Grid container spacing={2}>{children}</Grid>;
}

export function RouteSummary({ source, destination, schedule }: { source?: string | null; destination?: string | null; schedule?: ReactNode }) {
  if (!source && !destination) return null;

  return (
    <Box sx={(theme) => ({ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.035) })}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <MetadataField label="Source" value={source ?? 'Select source'} />
        <ArrowForwardRoundedIcon color="primary" aria-hidden />
        <MetadataField label="Destination" value={destination ?? 'Select destination'} />
      </Stack>
      {schedule ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>{schedule}</Typography> : null}
    </Box>
  );
}

export function AssignmentSummary({ label, option }: { label: string; option?: { label: string; subtitle?: string | null; status?: string | null } | null }) {
  if (!option) return null;
  return (
    <Box sx={(theme) => ({ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` })}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <MetadataField label={label} value={option.label} hint={option.subtitle} />
        {option.status ? <StatusChip value={option.status} /> : null}
      </Stack>
    </Box>
  );
}
