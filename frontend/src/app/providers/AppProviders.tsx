import type { PropsWithChildren } from 'react';
import AppThemeProvider from './ThemeProvider';
import AppQueryProvider from './QueryProvider';
import AppSnackbarProvider from './SnackbarProvider';

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <AppQueryProvider>
        <AppSnackbarProvider>{children}</AppSnackbarProvider>
      </AppQueryProvider>
    </AppThemeProvider>
  );
}