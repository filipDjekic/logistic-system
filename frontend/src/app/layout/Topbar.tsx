import { useMemo, useState } from 'react';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { authStore, useAuthStore } from '../../core/auth/authStore';
import NotificationBadge from '../../features/notifications/components/NotificationBadge';

type TopbarProps = {
  onOpenSidebar: () => void;
};

function getInitial(email: string | undefined) {
  if (!email) {
    return '?';
  }

  return email.charAt(0).toUpperCase();
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const auth = useAuthStore();
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);

  const userInitial = useMemo(() => getInitial(auth.user?.email), [auth.user?.email]);

  const handleSignOut = () => {
    authStore.setUnauthenticated();
    setUserAnchorEl(null);
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backdropFilter: 'blur(12px)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          minHeight: 72,
          px: { xs: 2, sm: 3, lg: 4 },
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={onOpenSidebar}
            sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuRoundedIcon />
          </IconButton>

          <Stack spacing={0.25}>
            <Typography variant="h6">Logistics System</Typography>
            <Typography variant="body2" color="text.secondary">
              Operational workspace
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationBadge />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={(event) => setUserAnchorEl(event.currentTarget)}
            sx={{
              px: 1,
              py: 0.75,
              borderRadius: 2,
              cursor: 'pointer',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Avatar sx={{ width: 34, height: 34 }}>{userInitial}</Avatar>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {auth.user?.email ?? '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {auth.user?.role ?? '-'}
              </Typography>
            </Box>

            <KeyboardArrowDownRoundedIcon fontSize="small" />
          </Stack>
        </Stack>
      </Stack>

      <Menu
        anchorEl={userAnchorEl}
        open={Boolean(userAnchorEl)}
        onClose={() => setUserAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 280,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {auth.user?.email ?? '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Role: {auth.user?.role ?? '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            User ID: {auth.user?.id ?? '-'}
          </Typography>
        </Box>

        <MenuItem onClick={handleSignOut}>
          <LogoutRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}