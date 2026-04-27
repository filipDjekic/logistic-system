import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material';

type PageLoaderProps = {
  message?: string;
  minHeight?: number | string;
};

export default function PageLoader({
  message = 'Loading page...',
  minHeight = '50vh',
}: PageLoaderProps) {
  return (
    <Box sx={{ minHeight, width: '100%' }} aria-busy="true" aria-live="polite">
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="text" width="42%" height={40} />
          <Skeleton variant="text" width="64%" height={22} />
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" width="100%" height={42} />
            <Skeleton variant="rounded" width="100%" height={42} />
            <Skeleton variant="rounded" width="92%" height={42} />
          </Stack>
        </Paper>

        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}
