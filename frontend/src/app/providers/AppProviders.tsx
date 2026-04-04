import type { PropsWithChildren } from 'react';
import AppThemeProvider from './ThemeProvider';
import AppQueryProvider from './QueryProvider';
import AppSnackbarProvider from './SnackbarProvider';
import AuthBootstrap from './AuthBootstrap';

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <AppQueryProvider>
        <AppSnackbarProvider>
          <AuthBootstrap>{children}</AuthBootstrap>
        </AppSnackbarProvider>
      </AppQueryProvider>
    </AppThemeProvider>
  );
}