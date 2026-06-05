import { Alert, Stack } from '@mui/material';

type ForbiddenTransitionHintProps = {
  visible: boolean;
  message?: string;
};

export default function ForbiddenTransitionHint({ visible, message = 'No transition is available. The current role, status, version or operational constraints forbid this lifecycle action.' }: ForbiddenTransitionHintProps) {
  if (!visible) {
    return null;
  }

  return (
    <Stack sx={{ mt: 2 }}>
      <Alert severity="warning">{message}</Alert>
    </Stack>
  );
}
