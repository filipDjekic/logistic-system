import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded';
import OfflineBoltRoundedIcon from '@mui/icons-material/OfflineBoltRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { Box, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';

type VehicleUsageCardProps = {
  total: number;
  counts: Partial<Record<'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE', number>>;
};

export default function VehicleUsageCard({
  total,
  counts,
}: VehicleUsageCardProps) {
  const items = [
    {
      label: 'Available',
      value: counts.AVAILABLE ?? 0,
      icon: <DirectionsCarRoundedIcon fontSize="small" />,
    },
    {
      label: 'In use',
      value: counts.IN_USE ?? 0,
      icon: <LocalShippingRoundedIcon fontSize="small" />,
    },
    {
      label: 'Maintenance',
      value: counts.MAINTENANCE ?? 0,
      icon: <BuildCircleRoundedIcon fontSize="small" />,
    },
    {
      label: 'Out of service',
      value: counts.OUT_OF_SERVICE ?? 0,
      icon: <OfflineBoltRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <SectionCard
      title="Vehicle usage"
      description="Current fleet distribution by status."
    >
      {total === 0 ? (
        <EmptyState
          title="No vehicles found"
          description="There are no vehicles available for this summary."
        />
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 1.5,
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                {item.icon}
                <Typography variant="body2">{item.label}</Typography>
              </Stack>

              <Typography variant="h6">{item.value}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}