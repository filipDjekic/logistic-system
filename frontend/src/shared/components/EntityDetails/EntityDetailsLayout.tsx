import type { ReactNode } from 'react';
import { Alert, Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../PageHeader/PageHeader';
import SectionCard from '../SectionCard/SectionCard';
import PageLoader from '../Loader/PageLoader';
import ErrorState from '../ErrorState/ErrorState';
import DetailsTabs from './DetailsTabs';
import DetailsHero from './DetailsHero';
import DetailsActionBar from './DetailsActionBar';
import type { DetailsAction } from './DetailsActionBar';
import type { DetailsHeroProps } from './DetailsHero';

type DetailsBreadcrumb = {
  label: ReactNode;
  to?: string;
};

type DetailsTab = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end' | 'top' | 'bottom';
};

type EntityDetailsLayoutProps = {
  overline?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  actionItems?: DetailsAction[];
  breadcrumbs?: DetailsBreadcrumb[];
  hero?: DetailsHeroProps | null;
  loading?: boolean;
  loadingText?: string;
  error?: unknown;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  tabs?: DetailsTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  stickyTabs?: boolean;
  children: ReactNode;
};

function getErrorMessage(error: unknown, fallback?: string) {
  if (fallback) return fallback;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'The requested details could not be loaded.';
}

export default function EntityDetailsLayout({
  overline,
  title,
  description,
  actions,
  actionItems,
  breadcrumbs,
  hero,
  loading = false,
  loadingText = 'Loading details...',
  error,
  errorTitle = 'Unable to load details',
  errorDescription,
  onRetry,
  tabs,
  activeTab,
  onTabChange,
  stickyTabs = true,
  children,
}: EntityDetailsLayoutProps) {
  const showTabs = Boolean(tabs?.length && activeTab && onTabChange);
  const actionSlot = actionItems?.length ? <DetailsActionBar actions={actionItems} /> : actions;

  return (
    <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0, width: '100%' }}>
      {breadcrumbs?.length ? (
        <Breadcrumbs aria-label="Details breadcrumbs" sx={{ px: { xs: 0.5, sm: 0 } }}>
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast || !breadcrumb.to ? (
              <Typography key={index} variant="body2" color={isLast ? 'text.primary' : 'text.secondary'} fontWeight={isLast ? 800 : 600}>
                {breadcrumb.label}
              </Typography>
            ) : (
              <Link key={index} component={RouterLink} to={breadcrumb.to} underline="hover" color="inherit" variant="body2" fontWeight={700}>
                {breadcrumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      ) : null}

      {hero ? (
        <DetailsHero {...hero} actionSlot={hero.actionSlot ?? actionSlot} />
      ) : (
        <PageHeader overline={overline} title={title} description={description} actions={actionSlot} />
      )}

      {loading ? <PageLoader message={loadingText} /> : null}

      {!loading && error ? (
        onRetry ? (
          <ErrorState title={errorTitle} description={getErrorMessage(error, errorDescription)} onRetry={onRetry} />
        ) : (
          <Alert severity="error">
            <Typography fontWeight={800}>{errorTitle}</Typography>
            <Typography variant="body2">{getErrorMessage(error, errorDescription)}</Typography>
          </Alert>
        )
      ) : null}

      {!loading && !error && showTabs ? (
        <Box
          sx={stickyTabs ? {
            position: 'sticky',
            top: { xs: 54, sm: 58 },
            zIndex: 20,
          } : undefined}
        >
          <SectionCard
            contentSx={{ p: 0, '&:last-child': { pb: 0 } }}
            sx={{ backgroundColor: 'background.paper' }}
          >
            <DetailsTabs value={activeTab as string} tabs={tabs as NonNullable<typeof tabs>} onChange={onTabChange as (value: string) => void} />
          </SectionCard>
        </Box>
      ) : null}

      {!loading && !error ? children : null}
    </Stack>
  );
}

export type { DetailsAction, DetailsBreadcrumb, DetailsHeroProps, DetailsTab, EntityDetailsLayoutProps };
