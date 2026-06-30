import type { ReactNode } from 'react';
import { Stack } from '@mui/material';
import RelatedDataSection from './RelatedDataSection';

type RelatedDataTabSection = {
  key: string;
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

type RelatedDataTabProps = {
  sections: RelatedDataTabSection[];
  spacing?: number;
};

export default function RelatedDataTab({ sections, spacing = 2 }: RelatedDataTabProps) {
  return (
    <Stack spacing={spacing} sx={{ minWidth: 0 }}>
      {sections.map((section) => (
        <RelatedDataSection
          key={section.key}
          title={section.title}
          description={section.description}
          action={section.action}
          loading={section.loading}
          error={section.error}
          empty={section.empty}
          emptyTitle={section.emptyTitle}
          emptyDescription={section.emptyDescription}
          onRetry={section.onRetry}
        >
          {section.children}
        </RelatedDataSection>
      ))}
    </Stack>
  );
}

export type { RelatedDataTabProps, RelatedDataTabSection };
