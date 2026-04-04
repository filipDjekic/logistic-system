import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        width: '100%',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 3,
        px: 3,
        py: 5,
        textAlign: 'center',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        {icon ? <Box>{icon}</Box> : null}

        <Typography variant="h6">{title}</Typography>

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
            {description}
          </Typography>
        ) : null}

        {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
      </Stack>
    </Box>
  );
}