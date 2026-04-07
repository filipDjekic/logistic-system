import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { DerivedInventoryStatus } from '../types/inventory.types';

type InventoryStatusChipProps = {
  status: DerivedInventoryStatus;
};

export default function InventoryStatusChip({
  status,
}: InventoryStatusChipProps) {
  return <StatusChip value={status} />;
}