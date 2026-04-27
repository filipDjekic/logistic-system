import type { ReactNode } from 'react';
import { alpha, Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';

type StatCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  accent?: 'primary' | 'info' | 'success' | 'warning' | 'error';
  progress?: number;
};

function getAccentColor(accent: NonNullable<StatCardProps['accent']>, themeModeValue: {
  primary: string;
  info: string;
  success: string;
  warning: string;
  error: string;
}) {
  return themeModeValue[accent];
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'primary',
  progress,
}: StatCardProps) {
  return (
    <Card
      sx={(theme) => ({
        height: '100%',
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        backgroundImage: 'none',
      })}
    >
      <CardContent sx={{ height: '100%', p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack justifyContent="space-between" spacing={2} sx={{ height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
                {title}
              </Typography>

              <Typography variant="h4" sx={{ lineHeight: 1, fontWeight: 800, fontSize: { xs: '1.55rem', sm: '2rem', md: '2.125rem' }, overflowWrap: 'anywhere' }}>
                {value}
              </Typography>
            </Stack>

            {icon ? (
              <Box
                sx={(theme) => {
                  const color = getAccentColor(accent, {
                    primary: theme.palette.primary.main,
                    info: theme.palette.info.main,
                    success: theme.palette.success.main,
                    warning: theme.palette.warning.main,
                    error: theme.palette.error.main,
                  });

                  return {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 1,
                    color,
                    bgcolor: alpha(color, 0.1),
                    border: `1px solid ${alpha(color, 0.2)}`,
                  };
                }}
              >
                {icon}
              </Box>
            ) : null}
          </Stack>

          <Stack spacing={1}>
            {typeof progress === 'number' ? (
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, progress))}
                color={accent}
                sx={{ height: 6, borderRadius: 999 }}
              />
            ) : null}

            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
