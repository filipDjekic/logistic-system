import { Box, Stack, Typography, useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SectionCard from '../SectionCard/SectionCard';

export type ChartDatum = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number | null;
};

type ChartKind = 'bar' | 'donut' | 'line' | 'comparison' | 'single';

type Props = {
  title: string;
  description?: string;
  data: ChartDatum[];
  kind?: ChartKind;
  height?: number;
};

function toChartNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function hasData(data: ChartDatum[]) {
  return data.some((item) => toChartNumber(item.value) > 0 || toChartNumber(item.secondaryValue) > 0);
}

export function normalizeChartData(
  data: Array<{ key: string; label: string; value: number | string; secondaryValue?: number | string | null }>,
): ChartDatum[] {
  return data.map((item) => ({
    key: item.key,
    label: item.label,
    value: toChartNumber(item.value),
    secondaryValue: item.secondaryValue === null || typeof item.secondaryValue === 'undefined' ? null : toChartNumber(item.secondaryValue),
  }));
}

export function recordToChartData(record: Record<string, number | string>, fallbackLabel = 'Unknown'): ChartDatum[] {
  return Object.entries(record).map(([key, value]) => ({
    key,
    label: key ? key.replaceAll('_', ' ').toLowerCase().replace(/^./, (char) => char.toUpperCase()) : fallbackLabel,
    value: toChartNumber(value),
  }));
}

export default function ChartCard({ title, description, data, kind = 'bar', height = 280 }: Props) {
  const theme = useTheme();
  const palette = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
  ];

  const normalized = data.filter((item) => item.label);

  return (
    <SectionCard title={title} description={description} contentSx={{ height: '100%' }}>
      {normalized.length === 0 || !hasData(normalized) ? (
        <Stack justifyContent="center" alignItems="center" sx={{ minHeight: height }}>
          <Typography variant="body2" color="text.secondary">
            No chart data for the selected scope.
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            {kind === 'donut' ? (
              <PieChart>
                <Pie data={normalized} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
                  {normalized.map((entry, index) => (
                    <Cell key={entry.key} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                <Legend />
              </PieChart>
            ) : kind === 'line' ? (
              <LineChart data={normalized} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <BarChart data={normalized} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {normalized.map((entry, index) => (
                    <Cell key={entry.key} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>
      )}
    </SectionCard>
  );
}
