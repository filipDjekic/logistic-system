import StatusChip from '../../../shared/components/StatusChip/StatusChip';

type ShiftStatusChipProps = {
  value: string | null | undefined;
};

export default function ShiftStatusChip({ value }: ShiftStatusChipProps) {
  return <StatusChip value={value} />;
}