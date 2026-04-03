import { useContext } from 'react';
import { SnackbarContext } from './snackbar.context';

export function useAppSnackbar() {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useAppSnackbar must be used within AppSnackbarProvider');
  }

  return context;
}