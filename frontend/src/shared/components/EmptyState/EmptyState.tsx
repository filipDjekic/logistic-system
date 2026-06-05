import type { ReactNode } from 'react';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import { alpha, Box, Stack, Typography } from '@mui/material';

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
      sx={(theme) => ({
        width: '100%',
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.32)}`,
        borderRadius: 3,
        px: { xs: 2, sm: 3 },
        py: { xs: 3.5, sm: 5 },
        textAlign: 'center',
        outline: 'none',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.background.paper, 0.92)})`,
        '&:focus-visible': {
          borderColor: 'primary.main',
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      })}
    >
      <Stack spacing={1.35} alignItems="center">
        <Box
          sx={(theme) => ({
            width: 56,
            height: 56,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            color: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          })}
        >
          {icon ?? <InboxRoundedIcon />}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 850 }}>{title}</Typography>

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 580 }}>
            {description}
          </Typography>
        ) : null}

        {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
      </Stack>
    </Box>
  );
}
