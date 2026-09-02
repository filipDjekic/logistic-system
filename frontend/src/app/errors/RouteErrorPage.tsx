import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

function errorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`.trim();
  }
  return error instanceof Error ? error.message : 'This page could not be displayed.';
}

export default function RouteErrorPage() {
  const error = useRouteError();

  console.error('React Router caught an application error', error);

  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Paper sx={{ width: 'min(100%, 680px)', p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" component="h1" fontWeight={800}>This page could not be displayed</Typography>
          <Alert severity="error">An unexpected interface error occurred. Your data was not changed.</Alert>
          {import.meta.env.DEV ? (
            <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {errorMessage(error)}
            </Typography>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" onClick={() => window.location.reload()}>Reload page</Button>
            <Button component="a" href="/dashboard" variant="outlined">Go to dashboard</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
