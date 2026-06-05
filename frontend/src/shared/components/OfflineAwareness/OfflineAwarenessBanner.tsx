import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import { Alert, Box } from '@mui/material';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineAwarenessBanner() {
  const online = useOnlineStatus();

  if (online) {
    return null;
  }

  return (
    <Box sx={{ px: { xs: 1.25, sm: 2.25, lg: 3 }, pt: { xs: 1, sm: 1.25 } }}>
      <Alert icon={<WifiOffRoundedIcon />} severity="warning" variant="outlined">
        You are offline. Current screen data may be stale and operational changes should be confirmed after reconnecting.
      </Alert>
    </Box>
  );
}
