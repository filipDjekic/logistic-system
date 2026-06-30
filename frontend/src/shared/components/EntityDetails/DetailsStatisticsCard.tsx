import type { ReactNode } from 'react';
import { Grid } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import SectionCard from '../SectionCard/SectionCard';
import StatCard from '../StatCard/StatCard';

type DetailsStatistic = {
  key?: string;
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  accent?: 'primary' | 'info' | 'success' | 'warning' | 'error';
  progress?: number;
  size?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
};

type DetailsStatisticsCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  statistics?: DetailsStatistic[];
  children?: ReactNode;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  sx?: SxProps<Theme>;
};

const defaultColumns = { xs: 12, sm: 6, md: 3 };

export default function DetailsStatisticsCard({
  title = 'Statistics',
  description,
  action,
  statistics,
  children,
  columns = defaultColumns,
  sx,
}: DetailsStatisticsCardProps) {
  const hasStatistics = Boolean(statistics?.length);

  return (
    <SectionCard title={title} description={description} action={action} sx={sx}>
      {hasStatistics ? (
        <Grid container spacing={1.5}>
          {statistics?.map((statistic, index) => {
            const { key, size, ...statCardProps } = statistic;
            return (
              <Grid key={key ?? String(index)} size={size ?? columns}>
                <StatCard {...statCardProps} />
              </Grid>
            );
          })}
        </Grid>
      ) : null}
      {children}
    </SectionCard>
  );
}

export type { DetailsStatistic, DetailsStatisticsCardProps };
