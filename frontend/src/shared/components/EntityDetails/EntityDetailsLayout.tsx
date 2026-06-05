import type { ReactNode } from 'react';
import { Stack } from '@mui/material';
import PageHeader from '../PageHeader/PageHeader';
import SectionCard from '../SectionCard/SectionCard';
import DetailsTabs from './DetailsTabs';

type EntityDetailsLayoutProps = {
  overline?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tabs?: {
    value: string;
    label: ReactNode;
    disabled?: boolean;
  }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  stickyTabs?: boolean;
  children: ReactNode;
};

export default function EntityDetailsLayout({
  overline,
  title,
  description,
  actions,
  tabs,
  activeTab,
  onTabChange,
  stickyTabs = true,
  children,
}: EntityDetailsLayoutProps) {
  const showTabs = Boolean(tabs?.length && activeTab && onTabChange);

  return (
    <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0 }}>
      <PageHeader overline={overline} title={title} description={description} actions={actions} />

      {showTabs ? (
        <SectionCard
          contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
          sx={stickyTabs ? {
            position: 'sticky',
            top: { xs: 54, sm: 58 },
            zIndex: 20,
            backgroundColor: 'background.paper',
          } : undefined}
        >
          <DetailsTabs value={activeTab as string} tabs={tabs as NonNullable<typeof tabs>} onChange={onTabChange as (value: string) => void} />
        </SectionCard>
      ) : null}

      {children}
    </Stack>
  );
}
