import type { ReactNode } from 'react';
import EmptyState from '../EmptyState/EmptyState';
import ErrorState from '../ErrorState/ErrorState';
import InlineLoader from '../Loader/InlineLoader';

type QueryStateBoundaryProps = {
  children: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingMessage?: string;
  loadingLines?: number;
  errorTitle?: string;
  errorDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
};

export default function QueryStateBoundary({
  children,
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingMessage = 'Loading...',
  loadingLines = 3,
  errorTitle = 'Request failed',
  errorDescription = 'The requested data could not be loaded. Check the data and try again.',
  emptyTitle = 'No data',
  emptyDescription,
  onRetry,
}: QueryStateBoundaryProps) {
  if (isLoading) {
    return <InlineLoader message={loadingMessage} lines={loadingLines} />;
  }

  if (isError) {
    return <ErrorState title={errorTitle} description={errorDescription} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
