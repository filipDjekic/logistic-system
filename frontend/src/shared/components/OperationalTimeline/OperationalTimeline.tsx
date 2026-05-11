import { Box, Stack, Typography, alpha } from '@mui/material';
import StatusChip from '../StatusChip/StatusChip';

type TimelineItem = {
  id: string | number;
  status?: string | null;
  title: string;
  description?: string | null;
  timestamp?: string | null;
  completed?: boolean;
  current?: boolean;
};

type Props = {
  items: TimelineItem[];
  emptyText?: string;
};

export default function OperationalTimeline({ items, emptyText = 'No lifecycle events available.' }: Props) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {items.map((item, index) => (
        <Stack key={item.id} direction="row" spacing={1.5} alignItems="stretch">
          <Stack alignItems="center" sx={{ width: 24, flexShrink: 0 }}>
            <Box
              sx={(theme) => ({
                width: 14,
                height: 14,
                mt: 0.5,
                borderRadius: '50%',
                backgroundColor: item.current
                  ? theme.palette.primary.main
                  : item.completed
                    ? theme.palette.success.main
                    : alpha(theme.palette.text.primary, 0.24),
                boxShadow: item.current ? `0 0 0 5px ${alpha(theme.palette.primary.main, 0.12)}` : 'none',
              })}
            />
            {index < items.length - 1 ? (
              <Box
                sx={(theme) => ({
                  width: 2,
                  flex: 1,
                  minHeight: 44,
                  backgroundColor: alpha(theme.palette.text.primary, 0.12),
                })}
              />
            ) : null}
          </Stack>

          <Box sx={{ pb: index < items.length - 1 ? 2 : 0, flex: 1, minWidth: 0 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
              <Typography variant="body2" fontWeight={900}>{item.title}</Typography>
              {item.status ? <StatusChip value={item.status} /> : null}
            </Stack>
            {item.description ? (
              <Typography variant="caption" color="text.secondary">{item.description}</Typography>
            ) : null}
            {item.timestamp ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>{item.timestamp}</Typography>
            ) : null}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
