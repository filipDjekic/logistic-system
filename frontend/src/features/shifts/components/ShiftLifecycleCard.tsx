import { Chip } from '@mui/material';
import { DetailsLifecycleCard } from '../../../shared/components/EntityDetails';
import ShiftStatusChip from './ShiftStatusChip';
import type { ShiftResponse } from '../types/shift.types';
import { getAllowedShiftTransitions, getShiftLifecycleDescription, shiftLifecycleOrder, shiftTerminalStatuses } from '../utils/shiftLifecycle';

export default function ShiftLifecycleCard({ shift, showHistory = false }: { shift: ShiftResponse; showHistory?: boolean }) {
  const allowedStatuses = getAllowedShiftTransitions(shift);
  const graphStatuses = shift.status === 'CANCELLED' ? ['PLANNED', 'CANCELLED'] as const : shiftLifecycleOrder;

  return (
    <DetailsLifecycleCard
      title="Lifecycle"
      currentStatus={shift.status}
      statusNode={
        <>
          <ShiftStatusChip value={shift.status} />
          {shift.status === 'PLANNED' ? <Chip size="small" variant="outlined" label="Editable" /> : null}
        </>
      }
      statusDescription={getShiftLifecycleDescription(shift.status)}
      statuses={graphStatuses}
      allowedNextStatuses={allowedStatuses}
      terminalStatuses={shiftTerminalStatuses}
      historyEntityName={showHistory ? 'SHIFT' : undefined}
      historyEntityId={showHistory ? shift.id : undefined}
      historyTitle="Shift lifecycle history"
      noActionsText={allowedStatuses.length === 0 ? 'No lifecycle transition is currently available.' : undefined}
    />
  );
}
