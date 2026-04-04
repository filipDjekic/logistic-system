import { CircularProgress, Stack, Typography } from '@mui/material';

type InlineLoaderProps = {
  message?: string;
  size?: number;
};

export default function InlineLoader({
  message = 'Loading...',
  size = 20,
}: InlineLoaderProps) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Stack>
  );
}