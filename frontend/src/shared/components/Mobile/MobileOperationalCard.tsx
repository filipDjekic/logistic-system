import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type MobileOperationalCardProps = {
  overline?: ReactNode;
  title: ReactNode;
  status?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
};

export default function MobileOperationalCard({ overline, title, status, meta, children, actions, onClick }: MobileOperationalCardProps) {
  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onClick();
      }}
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        boxShadow: theme.shadows[1],
        cursor: onClick ? 'pointer' : 'default',
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Stack spacing={0.35} sx={{ minWidth: 0 }}>
            {overline ? <Typography variant="caption" color="text.secondary" fontWeight={800}>{overline}</Typography> : null}
            <Typography variant="subtitle1" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>{title}</Typography>
            {meta ? <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{meta}</Typography> : null}
          </Stack>
          {status ? <Box sx={{ flexShrink: 0 }}>{status}</Box> : null}
        </Stack>

        {children ? <Box>{children}</Box> : null}
        {actions ? <Box data-row-action="true" onClick={(event) => event.stopPropagation()}>{actions}</Box> : null}
      </Stack>
    </Box>
  );
}
