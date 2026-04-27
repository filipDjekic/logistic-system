import { Skeleton, Stack, Typography } from '@mui/material';

type InlineLoaderProps = {
  message?: string;
  lines?: number;
};

export default function InlineLoader({ message = 'Loading...', lines = 3 }: InlineLoaderProps) {
  return (
    <Stack spacing={1} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} variant="rounded" width={index === lines - 1 ? '72%' : '100%'} height={28} />
      ))}
      <Typography variant="caption" color="text.secondary">
        {message}
      </Typography>
    </Stack>
  );
}
