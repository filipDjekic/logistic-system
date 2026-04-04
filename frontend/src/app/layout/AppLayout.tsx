import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Topbar from './Topbar';
import PageContainer from './PageContainer';
import BreadcrumbsBar from './BreadcrumbsBar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          ml: { xs: 0, lg: `${SIDEBAR_WIDTH}px` },
        }}
      >
        <Topbar />

        <PageContainer>
          <Box sx={{ mb: 2 }}>
            <BreadcrumbsBar />
          </Box>

          <Outlet />
        </PageContainer>
      </Box>
    </Box>
  );
}