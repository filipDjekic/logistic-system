import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the original exception and component stack visible to developers.
    console.error('Unhandled React application error', error, info);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Paper sx={{ width: 'min(100%, 680px)', p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2.5}>
            <Typography variant="h4" component="h1" fontWeight={800}>
              This page could not be displayed
            </Typography>
            <Alert severity="error">
              An unexpected interface error occurred. Your data was not changed.
            </Alert>
            {import.meta.env.DEV ? (
              <Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {this.state.error.message}
              </Typography>
            ) : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="contained" onClick={this.reload}>Reload page</Button>
              <Button component="a" href="/dashboard" variant="outlined">Go to dashboard</Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }
}
