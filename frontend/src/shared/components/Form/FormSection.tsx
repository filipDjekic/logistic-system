import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';

type FormSectionProps = PropsWithChildren<{
  title: string;
  description?: string;
  action?: ReactNode;
}>;

export default function FormSection({ title, description, action, children }: FormSectionProps) {
  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        justifyContent="space-between"
        sx={{ p: { xs: 1.5, sm: 2 } }}
      >
        <Stack spacing={0.35} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>{title}</Typography>
          {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
        </Stack>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
      <Divider />
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>{children}</Box>
    </Box>
  );
}
