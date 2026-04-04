import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';

type TransportStatusChartProps = {
  total: number;
  counts: Partial<Record<'CREATED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED', number>>;
};

export default function TransportStatusChart({
  total,
  counts,
}: TransportStatusChartProps) {
  const data = [
    { name: 'Created', value: counts.CREATED ?? 0 },
    { name: 'Assigned', value: counts.ASSIGNED ?? 0 },
    { name: 'In transit', value: counts.IN_TRANSIT ?? 0 },
    { name: 'Delivered', value: counts.DELIVERED ?? 0 },
    { name: 'Cancelled', value: counts.CANCELLED ?? 0 },
  ];

  return (
    <SectionCard
      title="Transport status"
      description="Breakdown of transport orders by current status."
    >
      {total === 0 ? (
        <EmptyState
          title="No transport orders"
          description="There are no transport orders available for chart rendering."
        />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total transport orders: {total}
          </Typography>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </SectionCard>
  );
}