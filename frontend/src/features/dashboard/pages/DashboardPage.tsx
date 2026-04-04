import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import DashboardStatsGrid from '../components/DashboardStatsGrid';
import InventoryAlertsCard from '../components/InventoryAlertsCard';
import MyTasksCard from '../components/MyTasksCard';
import TransportStatusChart from '../components/TransportStatusChart';
import VehicleUsageCard from '../components/VehicleUsageCard';
import { useDashboardData } from '../hooks/useDashboardData';

export default function DashboardPage() {
  const auth = useAuthStore();
  const dashboard = useDashboardData();

  if (dashboard.isLoading) {
    return <InlineLoader message="Loading dashboard data..." size={22} />;
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Dashboard could not be loaded"
        description="One or more dashboard data sources failed to load. Please try again."
        onRetry={dashboard.refetch}
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
        <Stack spacing={2}>
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
                Quick overview of your current logistics workspace.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Role: ${auth.user?.role ?? '-'}`} />
              <Chip label={`User ID: ${auth.user?.userId ?? '-'}`} />
              {dashboard.isAdmin ? (
                <Chip
                  icon={<AdminPanelSettingsRoundedIcon />}
                  label="Admin data scope enabled"
                  color="primary"
                  variant="outlined"
                />
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <DashboardStatsGrid isAdmin={dashboard.isAdmin} stats={dashboard.stats} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            xl: dashboard.isAdmin ? 'minmax(0, 1.5fr) minmax(0, 1fr)' : '1fr',
          },
        }}
      >
        <Stack spacing={2}>
          {dashboard.isAdmin ? (
            <TransportStatusChart
              total={dashboard.transportOrders.length}
              counts={dashboard.transportStatusCounts}
            />
          ) : null}

          <MyTasksCard tasks={dashboard.myTasks} />
        </Stack>

        {dashboard.isAdmin ? (
          <Stack spacing={2}>
            <VehicleUsageCard
              total={dashboard.vehicles.length}
              counts={dashboard.vehicleStatusCounts}
            />

            <InventoryAlertsCard items={dashboard.inventoryAlerts} />
          </Stack>
        ) : null}
      </Box>
    </Stack>
  );
}