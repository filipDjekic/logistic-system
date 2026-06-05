import { Alert, Stack, Typography } from '@mui/material';
import { normalizeApiError } from '../../../core/api/apiError';

type FormGlobalErrorProps = {
  error: unknown;
  fallbackMessage?: string;
};

export default function FormGlobalError({
  error,
  fallbackMessage,
}: FormGlobalErrorProps) {
  if (!error) {
    return null;
  }

  const normalized = normalizeApiError(error, fallbackMessage);

  return (
    <Alert severity="error">
      <Stack spacing={0.5}>
        <Typography variant="body2" fontWeight={700}>
          {normalized.title}
        </Typography>
        <Typography variant="body2">{normalized.message}</Typography>
        {normalized.fieldErrors.length > 0 ? (
          <Stack component="ul" sx={{ m: 0, pl: 2 }}>
            {normalized.fieldErrors.map((fieldError) => (
              <Typography component="li" variant="body2" key={fieldError}>
                {fieldError}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Alert>
  );
}
