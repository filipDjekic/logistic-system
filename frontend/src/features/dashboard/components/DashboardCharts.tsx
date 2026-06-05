import { Box } from '@mui/material';
import { ChartCard, normalizeChartData } from '../../../shared/components/Charts';
import type { DashboardChartResponse } from '../api/dashboardApi';

type Props = {
  charts?: DashboardChartResponse[];
};

function resolveChartKind(type: string) {
  if (type === 'STATUS_DONUT') return 'donut' as const;
  if (type === 'COMPARISON_BAR') return 'comparison' as const;
  if (type === 'SINGLE_VALUE') return 'bar' as const;
  return 'bar' as const;
}

export default function DashboardCharts({ charts = [] }: Props) {
  if (charts.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
      }}
    >
      {charts.map((chart) => (
        <ChartCard
          key={chart.key}
          title={chart.title}
          description="Live aggregate dataset for this dashboard scope."
          data={normalizeChartData(chart.items)}
          kind={resolveChartKind(chart.type)}
        />
      ))}
    </Box>
  );
}
