import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { UserStatus } from '../types/user.types';

type UserStatusChipProps = {
  value: UserStatus | null | undefined;
};

export default function UserStatusChip({ value }: UserStatusChipProps) {
  return <StatusChip value={value} />;
}