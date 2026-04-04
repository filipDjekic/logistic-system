import { Box, CircularProgress, Stack, Typography } from '@mui/material';

type PageLoaderProps = {
  message?: string;
  minHeight?: number | string;
};

export default function PageLoader({
  message = 'Loading...',
  minHeight = '50vh',
}: PageLoaderProps) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'grid',
        placeItems: 'center',
        width: '100%',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}