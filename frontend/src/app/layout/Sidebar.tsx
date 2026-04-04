import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/authStore';
import { canAccess } from '../../core/permissions/canAccess';
import { navigationItems } from '../../core/config/navigation';

export const SIDEBAR_WIDTH = 280;

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarContent() {
  const auth = useAuthStore();

  const allowedItems = navigationItems.filter((item) =>
    canAccess({
      user: auth.user,
      allowedRoles: item.roles,
    }),
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ minHeight: '72px !important', px: 2.5 }}>
        <Box>
          <Box sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>Logistics System</Box>
          <Box sx={{ fontSize: 13, color: 'text.secondary' }}>Enterprise workspace</Box>
        </Box>
      </Toolbar>

      <Box sx={{ px: 1.5, pb: 2 }}>
        <List disablePadding>
          {allowedItems.map((item) => {
            const Icon = item.icon;

            return (
              <ListItemButton
                key={item.key}
                component={NavLink}
                to={item.to}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.active': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <SidebarContent />
      </Drawer>
    </>
  );
}