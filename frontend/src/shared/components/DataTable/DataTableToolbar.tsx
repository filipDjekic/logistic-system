import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';

type DataTableToolbarProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  search?: ReactNode;
};

export default function DataTableToolbar({
  title,
  description,
  actions,
  search,
}: DataTableToolbarProps) {
  const hasHeader = Boolean(title || description);
  const hasRightSide = Boolean(search || actions);

  if (!hasHeader && !hasRightSide) {
    return null;
  }

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', lg: 'center' }}
      spacing={2}
      sx={{ px: 2.5, pt: 2.5, pb: 2 }}
    >
      <Stack spacing={0.5}>
        {title ? <Typography variant="h6">{title}</Typography> : null}
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>

      {hasRightSide ? (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: { xs: '100%', lg: 'auto' } }}
        >
          {search}
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}