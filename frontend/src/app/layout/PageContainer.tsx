import type { PropsWithChildren } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

export default function PageContainer({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const isForm = /\/(create|edit)$/.test(pathname);
  const isDashboard = pathname === '/dashboard';
  const isDetails = /\/\d+(?:\/[^/]+)*$/.test(pathname);
  const maxWidth = isForm ? 1040 : isDetails ? 1280 : isDashboard ? 1480 : 1560;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
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
