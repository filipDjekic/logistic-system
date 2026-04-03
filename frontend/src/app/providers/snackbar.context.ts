import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

export type SnackbarPayload = {
  message: string;
  severity?: AlertColor;
};

export type SnackbarContextValue = {
  showSnackbar: (payload: SnackbarPayload) => void;
};

export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);