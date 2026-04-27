import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';

type PageHeaderProps = {
  title: string;
  description?: string;
  overline?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  overline,
  actions,
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={2}
      sx={{ mb: { xs: 2, md: 3 } }}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        {overline ? (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: '0.1em', fontWeight: 800, lineHeight: 1.2 }}
          >
            {overline}
          </Typography>
        ) : null}

        <Typography variant="h4" sx={{ maxWidth: 900, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.125rem' }, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
            {description}
          </Typography>
        ) : null}
      </Stack>

      {actions ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap sx={{ width: { xs: '100%', sm: 'auto' }, '& > *': { width: { xs: '100%', sm: 'auto' } } }}>
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
