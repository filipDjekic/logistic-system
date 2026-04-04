import type { PropsWithChildren } from 'react';
import { Box } from '@mui/material';

export default function PageContainer({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1440,
        mx: 'auto',
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      {children}
    </Box>
  );
}