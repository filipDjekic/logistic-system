import AssignmentLateRoundedIcon from '@mui/icons-material/AssignmentLateRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import MovingRoundedIcon from '@mui/icons-material/MovingRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import { alpha, Alert, Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import type { OperationalDashboardResponse, OperationalIncidentResponse, OperationalLiveAlertResponse, OperationalNextActionResponse, OperationalWarehouseCongestionResponse, OperationalWidgetResponse, OperationalWorkloadResponse } from '../api/dashboardApi';

type Props = {
  data?: OperationalDashboardResponse;
  loading?: boolean;
};

const iconByKey: Record<string, ReactNode> = {
  activeTransports: <LocalShippingRoundedIcon fontSize="small" />,
  blockedTasks: <AssignmentLateRoundedIcon fontSize="small" />,
  delayedTransport: <LocalShippingRoundedIcon fontSize="small" />,
  lowStock: <Inventory2RoundedIcon fontSize="small" />,
  movementActivity: <MovingRoundedIcon fontSize="small" />,
  overdueTasks: <PendingActionsRoundedIcon fontSize="small" />,
  vehicleUtilization: <DirectionsCarRoundedIcon fontSize="small" />,
  warehouseCongestion: <WarehouseRoundedIcon fontSize="small" />,
};

const colorBySeverity: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  neutral: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function navigateTo(navigate: ReturnType<typeof useNavigate>, route?: string | null) {
  if (route && route.trim().length > 0) {
    navigate(route);
  }
}

function priorityColor(priority: string | null | undefined): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
  switch ((priority ?? '').toLowerCase()) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'default';
  }
}

function NextActionCard({ action }: { action: OperationalNextActionResponse }) {
  const navigate = useNavigate();
  const hasRoute = Boolean(action.route);

  return (
    <Box
      role={hasRoute ? 'button' : undefined}
      tabIndex={hasRoute ? 0 : undefined}
      onClick={() => navigateTo(navigate, action.route)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigateTo(navigate, action.route);
        }
      }}
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.82),
        cursor: hasRoute ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1.25,
        '&:hover, &:focus-visible': hasRoute
          ? {
              outline: 'none',
              borderColor: alpha(theme.palette.primary.main, 0.55),
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }
          : undefined,
      })}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
          <Typography variant="subtitle2">{action.title}</Typography>
          <Chip size="small" color={priorityColor(action.priority)} label={(action.priority || 'normal').toUpperCase()} variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {action.description}
        </Typography>
      </Stack>
      {hasRoute ? (
        <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => navigateTo(navigate, action.route)}>
          {action.actionLabel || 'Open'}
        </Button>
      ) : null}
    </Box>
  );
}

function WidgetCard({ widget }: { widget: OperationalWidgetResponse }) {
  const navigate = useNavigate();
  const color = colorBySeverity[widget.severity] ?? 'default';
  const hasRoute = Boolean(widget.route);

  return (
    <Box
      role={hasRoute ? 'button' : undefined}
      tabIndex={hasRoute ? 0 : undefined}
      onClick={() => navigateTo(navigate, widget.route)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigateTo(navigate, widget.route);
        }
      }}
      sx={(theme) => ({
        p: 1.75,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        cursor: hasRoute ? 'pointer' : 'default',
        minHeight: 168,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: theme.transitions.create(['border-color', 'box-shadow', 'transform']),
        '&:hover, &:focus-visible': hasRoute
          ? {
              outline: 'none',
              borderColor: alpha(theme.palette.primary.main, 0.55),
              boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.12)}`,
              transform: 'translateY(-2px)',
            }
          : undefined,
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box
            sx={(theme) => ({
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            })}
          >
            {iconByKey[widget.key] ?? <TaskAltRoundedIcon fontSize="small" />}
          </Box>
          <Chip size="small" color={color} label={widget.severity.toUpperCase()} variant="outlined" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {formatNumber(widget.value)}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {widget.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {widget.description}
          </Typography>
        </Stack>
      </Stack>

      {hasRoute ? (
        <Button size="small" sx={{ alignSelf: 'flex-start', mt: 1 }} onClick={() => navigateTo(navigate, widget.route)}>
          {widget.actionLabel || 'Open'}
        </Button>
      ) : null}
    </Box>
  );
}


function LiveAlertCard({ alert }: { alert: OperationalLiveAlertResponse }) {
  const navigate = useNavigate();
  const color = colorBySeverity[alert.severity] ?? 'info';
  return (
    <Alert
      severity={color === 'default' ? 'info' : color}
      action={
        alert.route ? (
          <Button color="inherit" size="small" onClick={() => navigateTo(navigate, alert.route)}>
            {alert.actionLabel || 'Open'}
          </Button>
        ) : null
      }
    >
      <Typography variant="subtitle2">{alert.title}</Typography>
      <Typography variant="body2">{alert.message}</Typography>
    </Alert>
  );
}

function IncidentCard({ incident }: { incident: OperationalIncidentResponse }) {
  const navigate = useNavigate();
  const color = colorBySeverity[incident.severity] ?? 'default';
  return (
    <Box
      role={incident.route ? 'button' : undefined}
      tabIndex={incident.route ? 0 : undefined}
      onClick={() => navigateTo(navigate, incident.route)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigateTo(navigate, incident.route);
        }
      }}
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.88),
        cursor: incident.route ? 'pointer' : 'default',
        '&:hover, &:focus-visible': incident.route
          ? { outline: 'none', borderColor: alpha(theme.palette.primary.main, 0.55), bgcolor: alpha(theme.palette.primary.main, 0.04) }
          : undefined,
      })}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="subtitle2">{incident.title}</Typography>
          <Chip size="small" color={color} label={formatNumber(incident.count)} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {incident.description}
        </Typography>
        {incident.route ? (
          <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={() => navigateTo(navigate, incident.route)}>
            {incident.actionLabel || 'Open'}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

function WorkloadCard({ item }: { item: OperationalWorkloadResponse }) {
  const navigate = useNavigate();
  const color = colorBySeverity[item.severity] ?? 'default';
  return (
    <Box
      role={item.route ? 'button' : undefined}
      tabIndex={item.route ? 0 : undefined}
      onClick={() => navigateTo(navigate, item.route)}
      sx={(theme) => ({ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, cursor: item.route ? 'pointer' : 'default' })}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">{item.title}</Typography>
          <Chip size="small" color={color} label={item.severity.toUpperCase()} variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary">{item.description}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`Open ${formatNumber(item.openCount)}`} />
          <Chip size="small" color={item.blockedCount > 0 ? 'error' : 'success'} label={`Blocked ${formatNumber(item.blockedCount)}`} variant="outlined" />
          <Chip size="small" color={item.overdueCount > 0 ? 'warning' : 'success'} label={`Overdue ${formatNumber(item.overdueCount)}`} variant="outlined" />
        </Stack>
      </Stack>
    </Box>
  );
}

function WarehouseCongestionCard({ item }: { item: OperationalWarehouseCongestionResponse }) {
  const navigate = useNavigate();
  const numericPercent = Number(item.capacityUsedPercent ?? 0);
  const progress = Number.isFinite(numericPercent) ? Math.min(100, Math.max(0, numericPercent)) : 0;
  const color = colorBySeverity[item.severity] ?? 'warning';
  return (
    <Box
      role={item.route ? 'button' : undefined}
      tabIndex={item.route ? 0 : undefined}
      onClick={() => navigateTo(navigate, item.route)}
      sx={(theme) => ({ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, cursor: item.route ? 'pointer' : 'default' })}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="subtitle2">{item.warehouseName}</Typography>
          <Chip size="small" color={color} label={`${item.capacityUsedPercent}%`} variant="outlined" />
        </Stack>
        <LinearProgress variant="determinate" value={progress} color={color === 'default' ? 'primary' : color} />
        <Typography variant="caption" color="text.secondary">
          {formatNumber(item.inventoryRows)} inventory row(s) are contributing to capacity usage.
        </Typography>
      </Stack>
    </Box>
  );
}

export default function OperationalDashboardPanel({ data, loading }: Props) {
  const navigate = useNavigate();
  const title = data?.title ?? 'Operational command board';
  const description = data?.description ?? 'Actionable operational widgets for the current role.';
  const emptyMessage = data?.emptyMessage ?? 'No active operational exceptions require attention.';

  if (loading && !data) {
    return (
      <SectionCard title="Operational command board" description="Loading operational workflow widgets.">
        <Typography variant="body2" color="text.secondary">
          Loading operational data...
        </Typography>
      </SectionCard>
    );
  }

  if (!data) {
    return null;
  }

  const nextActions = data.nextActions ?? [];
  const liveAlerts = data.liveAlerts ?? [];
  const incidents = data.incidents ?? [];
  const workload = data.workload ?? [];
  const warehouseCongestion = data.warehouseCongestion ?? [];
  const sla = data.sla ?? null;

  return (
    <Stack spacing={2}>
      {liveAlerts.length > 0 ? (
        <SectionCard title="Live operational alerts" description="Newest role-relevant problems that should be handled before routine work.">
          <Stack spacing={1}>
            {liveAlerts.map((alert) => (
              <LiveAlertCard key={alert.key} alert={alert} />
            ))}
          </Stack>
        </SectionCard>
      ) : null}

      {sla ? (
        <SectionCard title="SLA / deadline awareness" description="Immediate deadline pressure across tasks and transports.">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
            <Chip color={sla.overdueTasks > 0 ? 'error' : 'success'} label={`Overdue tasks ${formatNumber(sla.overdueTasks)}`} variant="outlined" />
            <Chip color={sla.delayedTransports > 0 ? 'error' : 'success'} label={`Delayed transports ${formatNumber(sla.delayedTransports)}`} variant="outlined" />
            <Chip color={sla.dueSoonTasks > 0 ? 'warning' : 'success'} label={`Tasks due soon ${formatNumber(sla.dueSoonTasks)}`} variant="outlined" />
            <Chip color={sla.dueSoonTransports > 0 ? 'warning' : 'success'} label={`Transports due soon ${formatNumber(sla.dueSoonTransports)}`} variant="outlined" />
          </Stack>
        </SectionCard>
      ) : null}

      {incidents.length > 0 ? (
        <SectionCard title="Grouped incident cards" description="Related operational exceptions grouped into recovery queues.">
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {incidents.map((incident) => (
              <IncidentCard key={incident.key} incident={incident} />
            ))}
          </Box>
        </SectionCard>
      ) : null}

      {workload.length > 0 ? (
        <SectionCard title="Workload balancing" description="Open, blocked and overdue work visible from the command center.">
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {workload.map((item) => (
              <WorkloadCard key={item.key} item={item} />
            ))}
          </Box>
        </SectionCard>
      ) : null}

      {warehouseCongestion.length > 0 ? (
        <SectionCard title="Warehouse congestion" description="Warehouses above safe capacity usage with direct navigation to details.">
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            {warehouseCongestion.map((item) => (
              <WarehouseCongestionCard key={item.warehouseId} item={item} />
            ))}
          </Box>
        </SectionCard>
      ) : null}

      {nextActions.length > 0 ? (
        <SectionCard title="Next actions" description="Role-specific actions that move work forward from the dashboard.">
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {nextActions.map((action) => (
              <NextActionCard key={action.key} action={action} />
            ))}
          </Box>
        </SectionCard>
      ) : null}

      <SectionCard title={title} description={description}>
        {data.widgets.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {data.widgets.map((widget) => (
              <WidgetCard key={widget.key} widget={widget} />
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard title="Workflow attention queue" description="Click any row to open the exact workflow/details screen.">
        <Stack spacing={1.25}>
          {data.flows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          ) : (
            data.flows.map((flow) => (
              <Box
                key={flow.key}
                role="button"
                tabIndex={0}
                onClick={() => navigateTo(navigate, flow.route)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigateTo(navigate, flow.route);
                  }
                }}
                sx={(theme) => ({
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  '&:hover, &:focus-visible': {
                    outline: 'none',
                    borderColor: alpha(theme.palette.primary.main, 0.55),
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                })}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                  <Stack spacing={0.35}>
                    <Typography variant="subtitle2">{flow.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flow.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {flow.entityType} #{flow.entityId ?? '-'} · {flow.dueAt ? new Date(flow.dueAt).toLocaleString() : 'No due date'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={flow.status} />
                    <Chip size="small" color={colorBySeverity[flow.severity] ?? 'default'} label={flow.severity.toUpperCase()} variant="outlined" />
                  </Stack>
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
