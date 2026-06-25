import { Box, Stack, Typography } from '@mui/material';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { StockMovementResponse, StockMovementStatus } from '../types/stockMovement.types';
import { normalizeStockMovementStatus, stockMovementLifecycleOrder } from '../utils/stockMovementLifecycle';

type Props = {
  movement: StockMovementResponse;
  currentStatus: string;
  allowedNextStatuses: string[];
};

const terminalStatuses: StockMovementStatus[] = ['EXECUTED', 'REJECTED', 'CANCELLED', 'REVERSED'];

function statusDescription(status: StockMovementStatus, movement: StockMovementResponse) {
  switch (status) {
    case 'DRAFT':
      return 'Created and waiting for approval or execution.';
    case 'PENDING_APPROVAL':
      return 'Waiting for manager approval before stock can be changed.';
    case 'APPROVED':
      return 'Approved and ready to be executed.';
    case 'EXECUTED':
      return `Inventory effect applied: ${movement.quantityBefore} → ${movement.quantityAfter}.`;
    case 'REJECTED':
      return 'Rejected before inventory was affected.';
    case 'CANCELLED':
      return 'Cancelled before inventory was affected.';
    case 'REVERSED':
      return movement.reversedByMovementId
        ? `Original movement reversed by movement #${movement.reversedByMovementId}.`
        : 'This movement is marked as reversed.';
    default:
      return 'Lifecycle step.';
  }
}

export default function StockMovementLifecycleTimeline({ movement, currentStatus, allowedNextStatuses }: Props) {
  const normalizedStatus = normalizeStockMovementStatus(currentStatus);
  const currentIndex = stockMovementLifecycleOrder.indexOf(normalizedStatus);

  return (
    <Stack spacing={1.25}>
      {stockMovementLifecycleOrder.map((status, index) => {
        const active = status === normalizedStatus;
        const reached = index <= currentIndex && !terminalStatuses.includes(normalizedStatus) || active;
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
                {statusDescription(status, movement)}
              </Typography>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
