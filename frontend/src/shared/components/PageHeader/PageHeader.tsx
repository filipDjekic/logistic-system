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
    >
      <Stack spacing={0.75}>
        {overline ? (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 1.2, fontWeight: 700 }}
          >
            {overline}
          </Typography>
        ) : null}

        <Typography variant="h4">{title}</Typography>

        {description ? (
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>

      {actions ? (
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}