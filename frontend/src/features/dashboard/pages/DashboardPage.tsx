import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { dashboardApi } from '../api/dashboardApi';
import CompanyAdminDashboardPanel from '../components/CompanyAdminDashboardPanel';
import DispatcherDashboardPanel from '../components/DispatcherDashboardPanel';
import DriverDashboardPanel from '../components/DriverDashboardPanel';
import HrManagerDashboardPanel from '../components/HrManagerDashboardPanel';
import OverlordDashboardPanel from '../components/OverlordDashboardPanel';
import WarehouseManagerDashboardPanel from '../components/WarehouseManagerDashboardPanel';
import WorkerDashboardPanel from '../components/WorkerDashboardPanel';

export default function DashboardPage() {
  const auth = useAuthStore();
  const role = auth.user?.role ?? null;
  const isOverlord = role === ROLES.OVERLORD;
  const isCompanyAdmin = role === ROLES.COMPANY_ADMIN;
  const isHrManager = role === ROLES.HR_MANAGER;
  const isWarehouseManager = role === ROLES.WAREHOUSE_MANAGER;
  const isDispatcher = role === ROLES.DISPATCHER;
  const isDriver = role === ROLES.DRIVER;
  const isWorker = role === ROLES.WORKER;

  const overlordDashboardQuery = useQuery({
    queryKey: ['dashboard', 'overlord'],
    queryFn: dashboardApi.getOverlordDashboard,
    enabled: isOverlord,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const companyAdminDashboardQuery = useQuery({
    queryKey: ['dashboard', 'company-admin'],
    queryFn: dashboardApi.getCompanyAdminDashboard,
    enabled: isCompanyAdmin,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const hrManagerDashboardQuery = useQuery({
    queryKey: ['dashboard', 'hr-manager'],
    queryFn: dashboardApi.getHrManagerDashboard,
    enabled: isHrManager,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const warehouseManagerDashboardQuery = useQuery({
    queryKey: ['dashboard', 'warehouse-manager'],
    queryFn: dashboardApi.getWarehouseManagerDashboard,
    enabled: isWarehouseManager,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const dispatcherDashboardQuery = useQuery({
    queryKey: ['dashboard', 'dispatcher'],
    queryFn: dashboardApi.getDispatcherDashboard,
    enabled: isDispatcher,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const driverDashboardQuery = useQuery({
    queryKey: ['dashboard', 'driver'],
    queryFn: dashboardApi.getDriverDashboard,
    enabled: isDriver,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const workerDashboardQuery = useQuery({
    queryKey: ['dashboard', 'worker'],
    queryFn: dashboardApi.getWorkerDashboard,
    enabled: isWorker,
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

  const activeQuery = isOverlord
    ? overlordDashboardQuery
    : isCompanyAdmin
      ? companyAdminDashboardQuery
      : isHrManager
        ? hrManagerDashboardQuery
        : isWarehouseManager
          ? warehouseManagerDashboardQuery
          : isDispatcher
            ? dispatcherDashboardQuery
            : isDriver
              ? driverDashboardQuery
              : isWorker
                ? workerDashboardQuery
                : null;

  if (activeQuery?.isLoading) {
    return <InlineLoader message="Loading dashboard data..." size={22} />;
  }

  if (activeQuery?.isError) {
    return (
      <ErrorState
        title="Dashboard could not be loaded"
        description="Dashboard data source failed to load."
        onRetry={() => void activeQuery.refetch()}
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
      ) : null}

      {isCompanyAdmin && companyAdminDashboardQuery.data ? (
        <CompanyAdminDashboardPanel data={companyAdminDashboardQuery.data} />
      ) : null}

      {isHrManager && hrManagerDashboardQuery.data ? (
        <HrManagerDashboardPanel data={hrManagerDashboardQuery.data} />
      ) : null}

      {isWarehouseManager && warehouseManagerDashboardQuery.data ? (
        <WarehouseManagerDashboardPanel data={warehouseManagerDashboardQuery.data} />
      ) : null}

      {isDispatcher && dispatcherDashboardQuery.data ? (
        <DispatcherDashboardPanel data={dispatcherDashboardQuery.data} />
      ) : null}

      {isDriver && driverDashboardQuery.data ? (
        <DriverDashboardPanel data={driverDashboardQuery.data} />
      ) : null}

      {isWorker && workerDashboardQuery.data ? (
        <WorkerDashboardPanel data={workerDashboardQuery.data} />
      ) : null}

      {!isOverlord && !isCompanyAdmin && !isHrManager && !isWarehouseManager && !isDispatcher && !isDriver && !isWorker ? (
        <ErrorState
          title="Dashboard is not implemented for this role"
          description={`Dashboard for ${role} will be added as a separate role-specific dashboard.`}
        />
      ) : null}
    </Stack>
  );
}
