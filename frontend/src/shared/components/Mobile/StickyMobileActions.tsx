import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { alpha, Box, Button, Stack, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';

type StickyMobileAction = {
  label: string;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  icon?: ReactNode;
};

type StickyMobileActionsProps = {
  title?: string;
  description?: string;
  actions: StickyMobileAction[];
};

export default function StickyMobileActions({ title = 'Quick actions', description, actions }: StickyMobileActionsProps) {
  const visibleActions = actions.filter(Boolean).slice(0, 3);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar + 3,
        px: 1.25,
        pt: 1,
        pb: 'calc(env(safe-area-inset-bottom) + 1rem)',
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.94),
        backdropFilter: 'blur(14px)',
        boxShadow: theme.shadows[4],
      })}
    >
      <Stack spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </Typography>
          {description ? <Typography variant="caption" color="text.secondary">{description}</Typography> : null}
        </Stack>

        <Stack direction="row" spacing={1}>
          {visibleActions.map((action) => (
            <Button
              key={action.label}
              fullWidth
              size="large"
              variant={action.variant ?? 'contained'}
              color={action.color}
              disabled={action.disabled}
              onClick={action.onClick}
              component={action.to ? RouterLink : 'button'}
              to={action.to}
              startIcon={action.icon}
              sx={{ minHeight: 48 }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
