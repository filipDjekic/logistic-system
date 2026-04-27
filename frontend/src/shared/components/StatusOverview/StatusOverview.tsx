import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import StatusChip from '../StatusChip/StatusChip';
import { getStatusConfig } from '../../../core/constants/statuses';

type StatusOverviewItem = {
  value: string;
  count: number;
  label?: string;
};

type StatusOverviewProps = {
  items: StatusOverviewItem[];
  title?: string;
};

export default function StatusOverview({ items, title = 'Current page status' }: StatusOverviewProps) {
  const theme = useTheme();
  const visibleItems = items.filter((item) => item.count > 0);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        px: 1.5,
        py: 1.25,
        backgroundColor: alpha(theme.palette.background.paper, 0.72),
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexWrap="wrap"
        useFlexGap
      >
        <Typography variant="caption" color="text.secondary" fontWeight={800} textTransform="uppercase" sx={{ letterSpacing: '0.04em' }}>
          {title}
        </Typography>

        {visibleItems.map((item) => {
          const config = getStatusConfig(item.value);

          return (
            <Stack key={item.value} direction="row" spacing={0.75} alignItems="center">
              <StatusChip value={item.value} />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {item.count} {item.label ?? config.label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
