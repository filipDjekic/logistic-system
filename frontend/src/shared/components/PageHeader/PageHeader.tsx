import type { ReactNode } from 'react';
import { alpha, Box, Stack, Typography } from '@mui/material';

type PageHeaderProps = {
  title: string;
  description?: string;
  overline?: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, description, overline, actions }: PageHeaderProps) {
  return (
    <Box
      sx={(theme) => ({
        mb: { xs: 1.5, md: 2.5 },
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)}, ${alpha(theme.palette.background.paper, 0.96)})`,
      })}
    >
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'flex-start' }}
      spacing={{ xs: 1.5, md: 2 }}
      sx={{ minWidth: 0 }}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
        {overline ? (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: '0.1em', fontWeight: 800, lineHeight: 1.2 }}
          >
            {overline}
          </Typography>
        ) : null}

        <Typography
          variant="h4"
          sx={{
            maxWidth: 980,
            fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' },
            lineHeight: { xs: 1.18, md: 1.22 },
            overflowWrap: 'anywhere',
          }}
        >
          {title}
        </Typography>

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 820, overflowWrap: 'anywhere' }}>
            {description}
          </Typography>
        ) : null}
      </Stack>

      {actions ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent={{ xs: 'stretch', md: 'flex-end' }}
          sx={{
            width: { xs: '100%', md: 'auto' },
            maxWidth: { md: '48%' },
            pt: { md: overline ? 0.5 : 0 },
            '& > *': { width: { xs: '100%', sm: 'auto' } },
          }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
    </Box>
  );
}
