import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getRouteMetaByPath } from '../router/routeMeta';

export default function BreadcrumbsBar() {
  const location = useLocation();
  const currentMeta = getRouteMetaByPath(location.pathname);

  if (!currentMeta) {
    return null;
  }

  const isDashboard = currentMeta.path === '/dashboard';

  return (
    <Breadcrumbs
      separator={<NavigateNextRoundedIcon sx={{ fontSize: 18 }} />}
      aria-label="breadcrumb"
    >
      {!isDashboard ? (
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          color="inherit"
          sx={{ fontSize: 14 }}
        >
          Dashboard
        </Link>
      ) : null}

      <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 600 }}>
        {currentMeta.breadcrumb}
      </Typography>
    </Breadcrumbs>
  );
}