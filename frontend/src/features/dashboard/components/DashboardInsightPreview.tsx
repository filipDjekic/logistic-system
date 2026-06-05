import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import type { DashboardChartResponse } from '../api/dashboardApi';

type Props = {
  charts?: DashboardChartResponse[];
};

function formatValue(value: number | string | null | undefined) {
  if (value === null || typeof value === 'undefined') return '-';

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : String(value);
}

export default function DashboardInsightPreview({ charts = [] }: Props) {
  if (charts.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
      }}
    >
      {charts.slice(0, 4).map((chart) => (
        <SectionCard
          key={chart.key}
          title={chart.title}
          description="Prepared dashboard dataset. Visual chart rendering is handled in the next graphics package."
        >
          <Stack spacing={1}>
            {chart.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No data for this dataset.
              </Typography>
            ) : (
              chart.items.slice(0, 5).map((item) => (
                <Box
                  key={item.key}
                  sx={(theme) => ({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {item.label}
                    </Typography>
                    {item.secondaryValue !== null && typeof item.secondaryValue !== 'undefined' ? (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Secondary: {formatValue(item.secondaryValue)}
                      </Typography>
                    ) : null}
                  </Stack>

                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {formatValue(item.value)}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </SectionCard>
      ))}
    </Box>
  );
}
