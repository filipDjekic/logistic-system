import type { PropsWithChildren } from 'react';
import { Box } from '@mui/material';

export default function PageContainer({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1440,
        minWidth: 0,
        mx: 'auto',
        px: { xs: 1.5, sm: 2.5, lg: 4 },
        py: { xs: 1.5, sm: 2.5, md: 3 },
      }}
    >
      {children}
    </Box>
  );
}