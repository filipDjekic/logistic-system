import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Box
      tabIndex={0}
      role="status"
      sx={{
        width: '100%',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        textAlign: 'center',
        outline: 'none',
        '&:focus-visible': {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}33`,
        },
      }}
    >
      <Stack spacing={1.25} alignItems="center">
        {icon ? <Box sx={{ color: 'text.secondary' }}>{icon}</Box> : null}

        <Typography variant="h6">{title}</Typography>

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
            {description}
          </Typography>
        ) : null}

        {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
      </Stack>
    </Box>
  );
}
