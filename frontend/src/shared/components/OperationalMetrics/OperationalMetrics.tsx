import type { ReactNode } from 'react';
import { alpha, Box, Stack, Typography, type Theme } from '@mui/material';
import StatusChip from '../StatusChip/StatusChip';

type OperationalMetricTone = 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

export type OperationalMetricItem = {
  label: string;
  value: ReactNode;
  helper?: string;
  status?: string | null;
  tone?: OperationalMetricTone;
};

type Props = {
  items: OperationalMetricItem[];
};

function getToneColor(tone: OperationalMetricTone, palette: Theme['palette']) {
  switch (tone) {
    case 'success':
      return palette.success.main;
    case 'warning':
      return palette.warning.main;
    case 'error':
      return palette.error.main;
    case 'info':
      return palette.info.main;
    case 'primary':
      return palette.primary.main;
    case 'neutral':
    default:
      return palette.text.secondary;
  }
}

export default function OperationalMetrics({ items }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`,
        },
        gap: 1.5,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={(theme) => {
            const color = getToneColor(item.tone ?? 'neutral', theme.palette);
            return {
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              p: 2,
              backgroundColor: alpha(color, 0.06),
              borderLeft: `4px solid ${alpha(color, 0.72)}`,
              minHeight: 112,
            };
          }}
        >
          <Stack spacing={1} sx={{ height: '100%' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
              <Typography variant="caption" color="text.secondary" fontWeight={900} textTransform="uppercase" sx={{ letterSpacing: '0.04em' }}>
                {item.label}
              </Typography>
              {item.status ? <StatusChip value={item.status} /> : null}
            </Stack>

            <Typography variant="h5" fontWeight={900} sx={{ overflowWrap: 'anywhere' }}>
              {item.value}
            </Typography>

            {item.helper ? (
              <Typography variant="caption" color="text.secondary">
                {item.helper}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
