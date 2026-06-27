import { Box, Stack, Typography } from '@mui/material';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { InventoryCountSessionResponse, InventoryCountSessionStatus } from '../types/inventoryCount.types';

type Props = {
  session: InventoryCountSessionResponse;
  allowedNextStatuses: InventoryCountSessionStatus[];
};

const lifecycleOrder: InventoryCountSessionStatus[] = [
  'OPEN',
  'COUNTING',
  'REVIEW',
  'APPROVED',
  'ADJUSTMENTS_CREATED',
  'CLOSED',
];

const terminalStatuses: InventoryCountSessionStatus[] = ['REJECTED', 'CANCELLED'];

function statusDescription(status: InventoryCountSessionStatus, session: InventoryCountSessionResponse) {
  switch (status) {
    case 'OPEN':
      return 'Session is prepared and the warehouse/bin inventory snapshot is available.';
    case 'COUNTING':
      return `${session.countedLineCount}/${session.lineCount} location lines have counted quantities.`;
    case 'REVIEW':
      return `${session.discrepancyLineCount} discrepancy lines are waiting for manager review.`;
    case 'APPROVED':
      return 'Discrepancies are approved. Adjustment movements can be created.';
    case 'ADJUSTMENTS_CREATED':
      return 'Stock movement adjustments were generated for approved discrepancies.';
    case 'CLOSED':
      return 'Session is closed and locked from further operational changes.';
    case 'REJECTED':
      return 'Review rejected the count results. Session can be corrected or cancelled according to backend rules.';
    case 'CANCELLED':
      return 'Session was cancelled before final close.';
    default:
      return 'Lifecycle step.';
  }
}

export default function InventoryCountLifecycleTimeline({ session, allowedNextStatuses }: Props) {
  const currentStatus = session.status;
  const displayOrder = terminalStatuses.includes(currentStatus)
    ? [...lifecycleOrder.slice(0, Math.max(1, lifecycleOrder.indexOf('REVIEW') + 1)), currentStatus]
    : lifecycleOrder;
  const currentIndex = displayOrder.indexOf(currentStatus);

  return (
    <Stack spacing={1.25}>
      {displayOrder.map((status, index) => {
        const active = status === currentStatus;
        const reached = active || (!terminalStatuses.includes(currentStatus) && currentIndex >= 0 && index <= currentIndex);
        const allowedNext = allowedNextStatuses.includes(status);

        return (
          <Stack key={status} direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={(theme) => ({
                width: 12,
                height: 12,
                mt: 0.75,
                borderRadius: '50%',
                bgcolor: active ? theme.palette.primary.main : reached ? theme.palette.text.secondary : theme.palette.divider,
                flex: '0 0 auto',
              })}
            />
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <StatusChip value={status} variant={active ? 'filled' : 'outlined'} emphasis={active ? 'strong' : undefined} />
                {allowedNext ? <Typography variant="caption" color="primary">Allowed next</Typography> : null}
              </Stack>
              <Typography variant="body2" color={active ? 'text.primary' : 'text.secondary'}>
                {statusDescription(status, session)}
              </Typography>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
