import { Button, Stack, Typography } from '@mui/material';

type ErrorStateProps = {
  title?: string;
  description?: string;
  details?: string[];
  retryLabel?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = 'Request failed',
  description = 'The requested data could not be loaded. Check the data and try again.',
  details = [],
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <Stack
      tabIndex={0}
      role="alert"
      spacing={1.25}
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      sx={{
        width: '100%',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        outline: 'none',
        '&:focus-visible': {
          borderColor: 'error.main',
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.error.main}33`,
        },
      }}
    >
      <Typography variant="h6">{title}</Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
        {description}
      </Typography>

      {details.length > 0 ? (
        <Stack spacing={0.5} sx={{ maxWidth: 640 }}>
          {details.map((detail) => (
            <Typography key={detail} variant="caption" color="text.secondary">
              {detail}
            </Typography>
          ))}
        </Stack>
      ) : null}

      {onRetry ? (
        <Button variant="contained" onClick={onRetry} sx={{ mt: 1 }}>
          {retryLabel}
        </Button>
      ) : null}
    </Stack>
  );
}
