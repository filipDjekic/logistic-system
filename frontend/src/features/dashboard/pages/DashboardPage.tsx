import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { dashboardApi } from '../api/dashboardApi';
import OverlordDashboardPanel from '../components/OverlordDashboardPanel';

export default function DashboardPage() {
  const auth = useAuthStore();
  const role = auth.user?.role ?? null;
  const isOverlord = role === ROLES.OVERLORD;

  const overlordDashboardQuery = useQuery({
    queryKey: ['dashboard', 'overlord'],
    queryFn: dashboardApi.getOverlordDashboard,
    enabled: isOverlord,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (!role) {
    return (
      <ErrorState
        title="Dashboard could not be loaded"
        description="Current user role is not available."
      />
    );
  }

  if (isOverlord && overlordDashboardQuery.isLoading) {
    return <InlineLoader message="Loading dashboard data..." size={22} />;
  }

  if (isOverlord && overlordDashboardQuery.isError) {
    return (
      <ErrorState
        title="Dashboard could not be loaded"
        description="Overlord dashboard data source failed to load."
        onRetry={() => void overlordDashboardQuery.refetch()}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139,92,246,0.16), rgba(34,211,238,0.08))'
              : 'linear-gradient(135deg, rgba(91,75,255,0.10), rgba(8,145,178,0.06))',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <DashboardRoundedIcon />
              <Typography variant="h4">Dashboard</Typography>
            </Stack>

            <Typography variant="body1" color="text.secondary">
              Role-based logistics overview.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Role: ${role}`} />
            <Chip label={`User ID: ${auth.user?.id ?? '-'}`} />
          </Stack>
        </Stack>
      </Box>

      {isOverlord && overlordDashboardQuery.data ? (
        <OverlordDashboardPanel data={overlordDashboardQuery.data} />
      ) : (
        <ErrorState
          title="Dashboard is not implemented for this role"
          description={`Dashboard for ${role} will be added as a separate role-specific dashboard.`}
        />
      )}
    </Stack>
  );
}