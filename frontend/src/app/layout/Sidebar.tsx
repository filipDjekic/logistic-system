import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/authStore';
import { canAccess } from '../../core/permissions/canAccess';
import { navigationItems } from '../../core/config/navigation';

export const SIDEBAR_WIDTH = 280;

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
            Logistics System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enterprise workspace
          </Typography>
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
                onClick={onNavigate}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.5,
                  minHeight: 48,
                  '&.active': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: 600,
                  }}
                />
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
        <SidebarContent onNavigate={onMobileClose} />
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