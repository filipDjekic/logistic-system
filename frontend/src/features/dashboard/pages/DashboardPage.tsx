import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { alpha, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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

type DashboardAction = {
  label: string;
  to: string;
  variant?: 'contained' | 'outlined';
  icon?: 'add' | 'list';
};

function getDashboardActions(role: string): DashboardAction[] {
  switch (role) {
    case ROLES.OVERLORD:
      return [
        { label: 'Create company', to: '/companies?create=1', variant: 'contained', icon: 'add' },
        { label: 'Open employees', to: '/employees', icon: 'list' },
        { label: 'Open audit logs', to: '/activity-logs', icon: 'list' },
      ];
    case ROLES.COMPANY_ADMIN:
      return [
        { label: 'Open employees', to: '/employees', variant: 'contained', icon: 'list' },
        { label: 'Open transport orders', to: '/transport-orders', icon: 'list' },
        { label: 'Open warehouses', to: '/warehouses', icon: 'list' },
      ];
    case ROLES.HR_MANAGER:
      return [
        { label: 'Create employee', to: '/employees?create=1', variant: 'contained', icon: 'add' },
        { label: 'Open shifts', to: '/shifts', icon: 'list' },
        { label: 'Employee task report', to: '/reports/employee-tasks', icon: 'list' },
      ];
    case ROLES.WAREHOUSE_MANAGER:
      return [
        { label: 'Create inventory record', to: '/inventory?create=1', variant: 'contained', icon: 'add' },
        { label: 'Create stock movement', to: '/stock-movements?create=1', icon: 'add' },
        { label: 'Create warehouse task', to: '/tasks?create=1', icon: 'add' },
      ];
    case ROLES.DISPATCHER:
      return [
        { label: 'Create transport order', to: '/transport-orders?create=1', variant: 'contained', icon: 'add' },
        { label: 'Create transport task', to: '/tasks?create=1', icon: 'add' },
        { label: 'Open vehicles', to: '/vehicles', icon: 'list' },
      ];
    case ROLES.DRIVER:
      return [
        { label: 'Open my transports', to: '/transport-orders', variant: 'contained', icon: 'list' },
        { label: 'Open my tasks', to: '/tasks', icon: 'list' },
        { label: 'Open my shifts', to: '/my-shifts', icon: 'list' },
      ];
    case ROLES.WORKER:
      return [
        { label: 'Open my tasks', to: '/tasks', variant: 'contained', icon: 'list' },
        { label: 'Open my shifts', to: '/my-shifts', icon: 'list' },
        { label: 'Open notifications', to: '/notifications', icon: 'list' },
      ];
    default:
      return [];
  }
}

const roleDashboardCopy: Record<string, { title: string; description: string }> = {
  [ROLES.OVERLORD]: {
    title: 'System control center',
    description: 'Global health, audit and operational totals across all companies.',
  },
  [ROLES.COMPANY_ADMIN]: {
    title: 'Company control center',
    description: 'Company people, transport, fleet and warehouse overview.',
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
  const navigate = useNavigate();
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

  const dashboardCopy = roleDashboardCopy[role] ?? {
    title: 'Dashboard',
    description: 'Role-based logistics overview.',
  };

  const dashboardActions = getDashboardActions(role);

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
            <Chip label={role} color="primary" variant="outlined" />
            <Chip label={`Updated: ${updatedAt}`} />
            <Button
              size="small"
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void activeQuery?.refetch()}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Box>

      {dashboardActions.length > 0 ? (
        <Box
          sx={(theme) => ({
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          })}
        >
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" color="text.secondary">
              Quick actions
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
              {dashboardActions.map((action) => (
                <Button
                  key={action.to}
                  variant={action.variant ?? 'outlined'}
                  startIcon={action.icon === 'add' ? <AddRoundedIcon /> : <ListAltRoundedIcon />}
                  onClick={() => navigate(action.to)}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>
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
