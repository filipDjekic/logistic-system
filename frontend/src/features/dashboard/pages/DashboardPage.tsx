import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { alpha, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/auth/authStore';
import { cacheTimes } from '../../../core/constants/cache';
import { queryKeys } from '../../../core/constants/queryKeys';
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
import LifecycleMonitoringPanel from '../components/LifecycleMonitoringPanel';

const roleDashboardCopy: Record<string, { title: string; description: string }> = {
  [ROLES.OVERLORD]: {
    title: 'System control center',
    description: 'Platform governance, access control, audit activity and system health.'
  },
  [ROLES.COMPANY_ADMIN]: {
    title: 'Company control center',
    description: 'Company-level action view for transports, tasks, stock risks and fleet capacity.',
  },
  [ROLES.HR_MANAGER]: {
    title: 'HR workspace',
    description: 'Employee coverage, shifts and HR task status.',
  },
  [ROLES.WAREHOUSE_MANAGER]: {
    title: 'Warehouse workspace',
    description: 'Stock health, warehouse tasks and recent stock movements.',
  },
  [ROLES.DISPATCHER]: {
    title: 'Dispatch workspace',
    description: 'Transport planning, available vehicles and available drivers.',
  },
  [ROLES.DRIVER]: {
    title: 'Driver workspace',
    description: 'Assigned transports and transport tasks.',
  },
  [ROLES.WORKER]: {
    title: 'Worker workspace',
    description: 'Open tasks, today tasks and shift status.',
  },
};

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
  const canViewLifecycleMonitoring = isOverlord;

  const overlordDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('overlord'),
    queryFn: dashboardApi.getOverlordDashboard,
    enabled: isOverlord,
    staleTime: cacheTimes.volatile,
  });

  const companyAdminDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('company-admin'),
    queryFn: dashboardApi.getCompanyAdminDashboard,
    enabled: isCompanyAdmin,
    staleTime: cacheTimes.volatile,
  });

  const hrManagerDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('hr-manager'),
    queryFn: dashboardApi.getHrManagerDashboard,
    enabled: isHrManager,
    staleTime: cacheTimes.volatile,
  });

  const warehouseManagerDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('warehouse-manager'),
    queryFn: dashboardApi.getWarehouseManagerDashboard,
    enabled: isWarehouseManager,
    staleTime: cacheTimes.volatile,
  });

  const dispatcherDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('dispatcher'),
    queryFn: dashboardApi.getDispatcherDashboard,
    enabled: isDispatcher,
    staleTime: cacheTimes.volatile,
  });

  const driverDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('driver'),
    queryFn: dashboardApi.getDriverDashboard,
    enabled: isDriver,
    staleTime: cacheTimes.volatile,
  });

  const workerDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.role('worker'),
    queryFn: dashboardApi.getWorkerDashboard,
    enabled: isWorker,
    staleTime: cacheTimes.volatile,
  });

  const lifecycleMonitoringQuery = useQuery({
    queryKey: queryKeys.dashboard.lifecycleMonitoring(),
    queryFn: dashboardApi.getLifecycleMonitoring,
    enabled: canViewLifecycleMonitoring,
    staleTime: cacheTimes.volatile,
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

  const dashboardCopy = roleDashboardCopy[role] ?? {
    title: 'Dashboard',
    description: 'Role-based logistics overview.',
  };

  const updatedAt = activeQuery?.dataUpdatedAt
    ? new Date(activeQuery.dataUpdatedAt).toLocaleString()
    : '-';

  return (
    <Stack spacing={2.5}>
      <Box
        sx={(theme) => ({
          p: { xs: 1.75, sm: 3 },
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(theme.palette.info.main, 0.08)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.info.main, 0.05)})`,
        })}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 42,
                height: 42,
                borderRadius: 1.5,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
              })}
            >
              <DashboardRoundedIcon />
            </Box>
            <Stack spacing={0.25}>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', sm: '2rem', md: '2.125rem' }, overflowWrap: 'anywhere' }}>
                {dashboardCopy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardCopy.description}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: { xs: '100%', md: 'auto' }, '& > *': { width: { xs: '100%', sm: 'auto' } } }}>
            <Chip label={`Updated: ${updatedAt}`} />
            <Button
              size="small"
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                void activeQuery?.refetch();
                if (canViewLifecycleMonitoring) {
                  void lifecycleMonitoringQuery.refetch();
                }
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Box>

      {canViewLifecycleMonitoring ? (
        <LifecycleMonitoringPanel
          data={lifecycleMonitoringQuery.data}
          loading={lifecycleMonitoringQuery.isLoading || lifecycleMonitoringQuery.isFetching}
          onRefresh={() => void lifecycleMonitoringQuery.refetch()}
        />
      ) : null}

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
