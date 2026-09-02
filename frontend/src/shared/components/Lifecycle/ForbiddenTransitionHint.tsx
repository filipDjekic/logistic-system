import { Alert, Stack } from '@mui/material';

type ForbiddenTransitionHintProps = {
  visible: boolean;
  message?: string;
};

export default function ForbiddenTransitionHint({ visible, message = 'No status change is available for this record.' }: ForbiddenTransitionHintProps) {
  if (!visible) {
    return null;
  }

  return (
    <Stack sx={{ mt: 2 }}>
      <Alert severity="warning">{message}</Alert>
    </Stack>
  );
}
