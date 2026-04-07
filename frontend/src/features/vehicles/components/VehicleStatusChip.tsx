import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { VehicleStatus } from '../types/vehicle.types';

type VehicleStatusChipProps = {
  status: VehicleStatus | null | undefined;
};

export default function VehicleStatusChip({ status }: VehicleStatusChipProps) {
  return <StatusChip value={status} />;
}