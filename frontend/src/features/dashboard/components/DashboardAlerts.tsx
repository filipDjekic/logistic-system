import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Alert, AlertTitle, Box, Chip, Stack, Typography } from '@mui/material';
import type { DashboardAlertResponse } from '../api/dashboardApi';

type Props = {
  alerts?: DashboardAlertResponse[];
};

function normalizeSeverity(severity: string | null | undefined): 'error' | 'warning' | 'info' | 'success' {
  const normalized = String(severity ?? '').toLowerCase();

  if (normalized === 'error' || normalized === 'critical') return 'error';
  if (normalized === 'warning' || normalized === 'warn') return 'warning';
  if (normalized === 'success') return 'success';
  return 'info';
}

export default function DashboardAlerts({ alerts = [] }: Props) {
  if (alerts.length === 0) {
    return (
      <Box
        sx={(theme) => ({
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        })}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <WarningAmberRoundedIcon fontSize="small" color="success" />
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">No operational alerts</Typography>
            <Typography variant="body2" color="text.secondary">
              Current dashboard metrics do not require attention.
            </Typography>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {alerts.map((alert) => (
        <Alert
          key={alert.key}
          severity={normalizeSeverity(alert.severity)}
          variant="outlined"
          sx={{ alignItems: 'flex-start', borderRadius: 2 }}
          action={
            <Chip
              size="small"
              label={Number(alert.count ?? 0).toLocaleString()}
              color={normalizeSeverity(alert.severity)}
              variant="outlined"
            />
          }
        >
          <AlertTitle sx={{ mb: 0.25 }}>{alert.title}</AlertTitle>
          {alert.message}
        </Alert>
      ))}
    </Stack>
  );
}
