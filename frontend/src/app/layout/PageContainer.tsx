import type { PropsWithChildren } from 'react';
import { Box } from '@mui/material';

export default function PageContainer({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1360,
        minWidth: 0,
        mx: 'auto',
        px: { xs: 1.25, sm: 2, lg: 3 },
        py: { xs: 1.25, sm: 2, md: 2.5 },
        pb: { xs: 'calc(env(safe-area-inset-bottom) + 7.5rem)', md: 2.5 },
      }}
    >
      {children}
    </Box>
  );
}