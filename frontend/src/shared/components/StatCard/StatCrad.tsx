import type { ReactNode } from 'react';
import { alpha, Box, Card, CardContent, Stack, Typography } from '@mui/material';

type StatCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  accent?: 'primary' | 'info' | 'success' | 'warning' | 'error';
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
}: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%' }}>
        <Stack justifyContent="space-between" spacing={3} sx={{ height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>

              <Typography variant="h4" sx={{ lineHeight: 1 }}>
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
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    color,
                    bgcolor: alpha(color, 0.12),
                    border: `1px solid ${alpha(color, 0.24)}`,
                  };
                }}
              >
                {icon}
              </Box>
            ) : null}
          </Stack>

          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}