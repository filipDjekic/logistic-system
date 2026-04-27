import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../core/auth/authStore';
import { canAccess } from '../../core/permissions/canAccess';
import { getNavigationSectionsForRole } from '../../core/config/navigation';

export const SIDEBAR_WIDTH = 280;

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuthStore();

  const allowedSections = getNavigationSectionsForRole(auth.user?.role)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccess({
          user: auth.user,
          allowedRoles: item.roles,
        }),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ minHeight: '64px !important', px: 2.25 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
            Logistics System
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Enterprise workspace
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.25,
          py: 1.5,
        }}
      >
        <Stack spacing={1.5}>
          {allowedSections.map((section) => (
            <Box key={section.key}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  px: 1.25,
                  pb: 0.75,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {section.label}
              </Typography>

              <List disablePadding>
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <ListItemButton
                      key={item.key}
                      component={NavLink}
                      to={item.to}
                      onClick={onNavigate}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.25,
                        minHeight: 42,
                        px: 1.25,
                        '&.active': {
                          backgroundColor: 'action.selected',
                        },
                        '&.active .MuiListItemIcon-root, &.active .MuiListItemText-primary': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: 14,
                          fontWeight: 650,
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Stack>
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
            width: { xs: 'min(88vw, 320px)', sm: SIDEBAR_WIDTH },
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
            width: { xs: 'min(88vw, 320px)', sm: SIDEBAR_WIDTH },
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
