import { Grid } from '@mui/material';
import { DetailsLifecycleCard } from '../../../../shared/components/EntityDetails';
import OperationalTimeline from '../../../../shared/components/OperationalTimeline/OperationalTimeline';
import { formatTemporalView } from '../../../../core/utils/timezoneFormat';
import TransportOrderStatusChip from '../TransportOrderStatusChip';
import type { TransportOrderResponse, TransportOrderStatus } from '../../types/transportOrder.types';
import { getStatusActionLabel } from './transportOrderDetailsUtils';

type TransportOrderLifecycleTabProps = {
  transportOrder: TransportOrderResponse;
  nextStatuses: TransportOrderStatus[];
  statusMutationPending?: boolean;
  onSelectTransition?: (status: TransportOrderStatus) => void;
};

const transportOrderLifecycleStatuses: TransportOrderStatus[] = [
  'DRAFT',
  'ASSIGNED',
  'PICKING',
  'PACKING',
  'READY_FOR_LOADING',
  'LOADING',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNING',
  'RESCHEDULED',
  'CANCELLED',
];

export default function TransportOrderLifecycleTab({
  transportOrder,
  nextStatuses,
  statusMutationPending = false,
  onSelectTransition,
}: TransportOrderLifecycleTabProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <DetailsLifecycleCard
          title="Live workflow state"
          description="This panel refreshes active transport context every 30 seconds while the order is not terminal."
          currentStatus={transportOrder.status}
          statusNode={<TransportOrderStatusChip status={transportOrder.status} />}
          statuses={transportOrderLifecycleStatuses}
          allowedNextStatuses={nextStatuses}
          terminalStatuses={['DELIVERED', 'FAILED', 'CANCELLED']}
          actions={nextStatuses.map((status) => ({
            key: status,
            label: getStatusActionLabel(status),
            variant: 'contained' as const,
            disabled: statusMutationPending || !onSelectTransition,
            onClick: () => onSelectTransition?.(status),
          }))}
          historyEntityName="TRANSPORT_ORDER"
          historyEntityId={transportOrder.id}
        >
          <OperationalTimeline
            items={(transportOrder.timeline ?? []).map((entry) => ({
              id: `${entry.status}-${entry.label}`,
              status: entry.status,
              title: entry.label,
              description: entry.description,
              timestamp: formatTemporalView(entry.timestampView, entry.timestamp),
              completed: entry.completed,
              current: entry.current,
            }))}
          />
        </DetailsLifecycleCard>
      </Grid>
    </Grid>
  );
}
