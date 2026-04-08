import StatusChip from '../../../shared/components/StatusChip/StatusChip';

type EmployeeStatusChipProps = {
  active: boolean | null | undefined;
};

export default function EmployeeStatusChip({ active }: EmployeeStatusChipProps) {
  if (typeof active !== 'boolean') {
    return null;
  }

  return <StatusChip value={active ? 'ACTIVE' : 'INACTIVE'} />;
}