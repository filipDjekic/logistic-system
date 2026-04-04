import { Button, Stack, Typography } from '@mui/material';

type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = 'Something went wrong',
  description = 'The requested data could not be loaded. Please try again.',
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      sx={{
        width: '100%',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 3,
        px: 3,
        py: 5,
      }}
    >
      <Typography variant="h6">{title}</Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
        {description}
      </Typography>

      {onRetry ? (
        <Button variant="contained" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Stack>
  );
}