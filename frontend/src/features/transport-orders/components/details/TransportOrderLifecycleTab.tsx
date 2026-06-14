import { Grid } from '@mui/material';
import SectionCard from '../../../../shared/components/SectionCard/SectionCard';
import OperationalTimeline from '../../../../shared/components/OperationalTimeline/OperationalTimeline';
import { LifecycleHistoryTimeline, LifecycleStatusGraph } from '../../../../shared/components/Lifecycle';
import { formatTemporalView } from '../../../../core/utils/timezoneFormat';
import type { TransportOrderResponse, TransportOrderStatus } from '../../types/transportOrder.types';

type TransportOrderLifecycleTabProps = {
  transportOrder: TransportOrderResponse;
  nextStatuses: TransportOrderStatus[];
};

export default function TransportOrderLifecycleTab({
  transportOrder,
  nextStatuses,
}: TransportOrderLifecycleTabProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <SectionCard title="Lifecycle graph" description="Allowed transport order status graph for the current lifecycle.">
          <LifecycleStatusGraph
            statuses={['DRAFT', 'ASSIGNED', 'PICKING', 'PACKING', 'READY_FOR_LOADING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNING', 'RESCHEDULED', 'CANCELLED'] as const}
            currentStatus={transportOrder.status}
            allowedNextStatuses={nextStatuses}
            terminalStatuses={['DELIVERED', 'FAILED', 'CANCELLED'] as const}
          />
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <SectionCard title="Live workflow state" description="This panel refreshes active transport context every 30 seconds while the order is not terminal.">
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
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LifecycleHistoryTimeline entityName="TRANSPORT_ORDER" entityId={transportOrder.id} />
      </Grid>
    </Grid>
  );
}
