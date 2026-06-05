import type { ReactNode } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import EmptyState from '../EmptyState/EmptyState';
import SectionCard from '../SectionCard/SectionCard';

type RelatedDataSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export default function RelatedDataSection({
  title,
  description,
  action,
  loading = false,
  error = false,
  empty = false,
  emptyTitle = 'No related data',
  emptyDescription = 'There are no records connected with this entity yet.',
  onRetry,
  children,
}: RelatedDataSectionProps) {
  let content = children;

  if (loading) {
    content = <Typography color="text.secondary">Loading related data...</Typography>;
  } else if (error) {
    content = (
      <EmptyState
        title="Related data could not be loaded"
        description="Refresh this section and try again."
        action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined}
      />
    );
  } else if (empty) {
    content = <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <SectionCard title={title} description={description} action={action}>
      <Stack spacing={2}>{content}</Stack>
    </SectionCard>
  );
}
