import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { buildBreadcrumbTrail } from '../router/routeMeta';

export default function BreadcrumbsBar() {
  const location = useLocation();
  const trail = buildBreadcrumbTrail(location.pathname);

  if (trail.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs
      separator={<NavigateNextRoundedIcon sx={{ fontSize: 18 }} />}
      aria-label="breadcrumb"
      maxItems={4}
      itemsBeforeCollapse={1}
      itemsAfterCollapse={2}
      sx={{
        '& .MuiBreadcrumbs-ol': {
          minWidth: 0,
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          overflowX: { xs: 'auto', sm: 'visible' },
          WebkitOverflowScrolling: 'touch',
          pb: { xs: 0.25, sm: 0 },
        },
        '& .MuiBreadcrumbs-li': { minWidth: 0 },
      }}
    >
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;

        if (isLast) {
          return (
            <Typography key={`${item.path}-${index}`} color="text.secondary" noWrap sx={{ fontSize: 14, fontWeight: 700, maxWidth: { xs: 180, sm: 320, md: 520 } }}>
              {item.breadcrumb}
            </Typography>
          );
        }

        return (
          <Link
            key={`${item.path}-${index}`}
            component={RouterLink}
            to={item.path}
            underline="hover"
            color="inherit"
            noWrap
            sx={{ fontSize: 14, maxWidth: { xs: 140, sm: 240 }, fontWeight: item.path === '/dashboard' ? 700 : 600 }}
          >
            {item.breadcrumb}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
