import { useMemo, useState, useContext } from 'react';
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
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { authStore, useAuthStore } from '../../core/auth/authStore';
import { clearQueryCache } from '../../core/query/queryClient';
import { getRouteMetaByPath } from '../router/routeMeta';
import NotificationBadge from '../../features/notifications/components/NotificationBadge';
import { ColorModeContext } from '@/shared/theme/theme';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  const { mode, toggleMode } = useContext(ColorModeContext);

  const userInitial = useMemo(() => getInitial(auth.user?.email), [auth.user?.email]);
  const currentRouteMeta = useMemo(() => getRouteMetaByPath(location.pathname), [location.pathname]);

  const handleSignOut = () => {
    clearQueryCache();
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
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.86),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          minHeight: { xs: 54, sm: 58 },
          px: { xs: 1.25, sm: 2.25, lg: 3 },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <IconButton
            onClick={onOpenSidebar}
            sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuRoundedIcon />
          </IconButton>

          <Stack spacing={0.15} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, maxWidth: { xs: 160, sm: 320, md: 520 } }} noWrap>
              {currentRouteMeta?.title ?? 'Logistics System'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
              {currentRouteMeta?.breadcrumb ?? 'Operational workspace'}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={toggleMode} color="inherit" aria-label="Toggle theme">
            {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          </IconButton>

          <NotificationBadge />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={(event) => setUserAnchorEl(event.currentTarget)}
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: 1.5,
              cursor: 'pointer',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Avatar sx={{ width: 30, height: 30, fontSize: 14 }}>{userInitial}</Avatar>

            <Box sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 220 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {auth.user?.email ?? '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {auth.user?.role ?? '-'}
              </Typography>
            </Box>

            <KeyboardArrowDownRoundedIcon fontSize="small" sx={{ display: { xs: 'none', sm: 'block' } }} />
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
            borderRadius: 2,
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
        </Box>

        <MenuItem onClick={() => { setUserAnchorEl(null); navigate('/profile'); }}>
          <AccountCircleRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
          My Profile
        </MenuItem>

        <MenuItem onClick={handleSignOut}>
          <LogoutRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}
