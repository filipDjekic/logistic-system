import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { TransportOrderStatus } from '../types/transportOrder.types';

type TransportOrderStatusChipProps = {
  status: TransportOrderStatus;
};

export default function TransportOrderStatusChip({
  status,
}: TransportOrderStatusChipProps) {
  return <StatusChip value={status} />;
}