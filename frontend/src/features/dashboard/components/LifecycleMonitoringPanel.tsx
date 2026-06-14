import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SyncProblemRoundedIcon from '@mui/icons-material/SyncProblemRounded';
import { Alert, AlertTitle, Box, Button, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { LifecycleAnalyticsResponse, LifecycleAlertResponse } from '../api/dashboardApi';

type Props = {
  data?: LifecycleAnalyticsResponse;
  loading?: boolean;
  onRefresh?: () => void;
};

function severity(alert: LifecycleAlertResponse): 'error' | 'warning' | 'info' | 'success' {
  const value = String(alert.severity ?? '').toLowerCase();
  if (value === 'critical' || value === 'error') return 'error';
  if (value === 'warning' || value === 'warn') return 'warning';
  if (value === 'success') return 'success';
  return 'info';
}

function totalFromRecord(values: Record<string, number> | undefined) {
  return Object.values(values ?? {}).reduce((sum, value) => sum + Number(value ?? 0), 0);
}

export default function LifecycleMonitoringPanel({ data, loading = false, onRefresh }: Props) {
  const navigate = useNavigate();
  const alerts = data?.alerts ?? [];
  const actionableAlerts = alerts.filter((alert) => Number(alert.count ?? 0) > 0);
  const totalTasks = totalFromRecord(data?.tasksByStatus);
  const totalTransports = totalFromRecord(data?.transportsByStatus);
  const totalVehicles = totalFromRecord(data?.vehiclesByStatus);

  return (
    <Box
      sx={(theme) => ({
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      })}
    >
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <InsightsRoundedIcon color="primary" />
            <Stack spacing={0.1}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Lifecycle monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SLA, stuck-state and recovery signals across operational workflows.
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Flows ${Number(data?.activeOperationalFlows ?? 0).toLocaleString()}`} color="primary" variant="outlined" />
            <Chip size="small" label={`Generated ${data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : '-'}`} />
            {onRefresh ? (
              <Button size="small" variant="outlined" onClick={onRefresh}>
                Refresh
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {loading ? <LinearProgress /> : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Chip label={`Tasks ${totalTasks.toLocaleString()}`} variant="outlined" />
          <Chip label={`Transports ${totalTransports.toLocaleString()}`} variant="outlined" />
          <Chip label={`Vehicles ${totalVehicles.toLocaleString()}`} variant="outlined" />
          <Chip label={`Overdue tasks ${Number(data?.overdueTasks ?? 0).toLocaleString()}`} color={data?.overdueTasks ? 'error' : 'success'} variant="outlined" />
          <Chip label={`Blocked ${Number(data?.blockedTasks ?? 0).toLocaleString()}`} color={data?.blockedTasks ? 'warning' : 'success'} variant="outlined" />
          <Chip label={`Stale vehicles ${Number(data?.staleReservedVehicles ?? 0).toLocaleString()}`} color={data?.staleReservedVehicles ? 'warning' : 'success'} variant="outlined" />
        </Stack>

        <Divider />

        {actionableAlerts.length === 0 ? (
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
            <AlertTitle>No lifecycle issues</AlertTitle>
            Active workflow monitoring does not detect stuck states, overdue transports or stale reservations.
          </Alert>
        ) : (
          <Stack spacing={1}>
            {actionableAlerts.map((alert) => (
              <Alert
                key={alert.key}
                severity={severity(alert)}
                variant="outlined"
                sx={{ borderRadius: 2, alignItems: 'flex-start' }}
                icon={<SyncProblemRoundedIcon />}
                action={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" color={severity(alert)} label={Number(alert.count ?? 0).toLocaleString()} />
                    {alert.route ? (
                      <Button size="small" color="inherit" onClick={() => { if (alert.route) navigate(alert.route); }}>
                        Open
                      </Button>
                    ) : null}
                  </Stack>
                }
              >
                <AlertTitle sx={{ mb: 0.25 }}>{alert.title}</AlertTitle>
                {alert.message}
              </Alert>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
