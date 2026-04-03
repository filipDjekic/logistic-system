import { Alert, Snackbar } from '@mui/material';
import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import { SnackbarContext, type SnackbarPayload } from './snackbar.context';

export function AppSnackbarProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<SnackbarPayload['severity']>('info');

  const showSnackbar = useCallback(({ message, severity = 'info' }: SnackbarPayload) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      showSnackbar,
    }),
    [showSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity={severity}
          onClose={() => setOpen(false)}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export default AppSnackbarProvider;