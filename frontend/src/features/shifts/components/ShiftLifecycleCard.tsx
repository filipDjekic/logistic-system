import { Chip, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { LifecycleStatusGraph } from '../../../shared/components/Lifecycle';
import ShiftStatusChip from './ShiftStatusChip';
import type { ShiftResponse } from '../types/shift.types';
import { getAllowedShiftTransitions, getShiftLifecycleDescription, shiftLifecycleOrder, shiftTerminalStatuses } from '../utils/shiftLifecycle';

export default function ShiftLifecycleCard({ shift }: { shift: ShiftResponse }) {
  const allowedStatuses = getAllowedShiftTransitions(shift);
  const graphStatuses = shift.status === 'CANCELLED' ? ['PLANNED', 'CANCELLED'] as const : shiftLifecycleOrder;

  return (
    <SectionCard title="Lifecycle" description="Shift status is controlled by backend lifecycle rules and scheduler transitions.">
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <ShiftStatusChip value={shift.status} />
          {shift.status === 'PLANNED' ? <Chip size="small" variant="outlined" label="Editable" /> : null}
          {shiftTerminalStatuses.includes(shift.status) ? <Chip size="small" variant="outlined" label="Terminal" /> : null}
        </Stack>
        <Typography variant="body2" color="text.secondary">{getShiftLifecycleDescription(shift.status)}</Typography>
        <LifecycleStatusGraph statuses={graphStatuses} currentStatus={shift.status} allowedNextStatuses={allowedStatuses} terminalStatuses={shiftTerminalStatuses} />
      </Stack>
    </SectionCard>
  );
}
