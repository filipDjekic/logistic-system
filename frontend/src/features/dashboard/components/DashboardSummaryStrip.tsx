import type { ReactNode } from 'react';
import { alpha, Box, Stack, Typography } from '@mui/material';

type Tone = 'default' | 'info' | 'success' | 'warning' | 'error';

export type DashboardSummaryItem = {
  label: string;
  value: ReactNode;
  tone?: Tone;
};

type Props = {
  items: DashboardSummaryItem[];
};

function getToneColor(tone: Tone, theme: any) {
  if (tone === 'info') return theme.palette.info.main;
  if (tone === 'success') return theme.palette.success.main;
  if (tone === 'warning') return theme.palette.warning.main;
  if (tone === 'error') return theme.palette.error.main;
  return theme.palette.text.secondary;
}

export default function DashboardSummaryStrip({ items }: Props) {
  return (
    <Box
      sx={(theme) => ({
        display: 'grid',
        gap: 1.25,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`,
        },
        p: 1.25,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.7 : 0.9),
      })}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={(theme) => {
            const color = getToneColor(item.tone ?? 'default', theme);

            return {
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(color, item.tone === 'default' ? 0.04 : 0.08),
              borderLeft: `3px solid ${alpha(color, item.tone === 'default' ? 0.45 : 0.9)}`,
            };
          }}
        >
          <Stack spacing={0.35}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {item.label}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {item.value}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
