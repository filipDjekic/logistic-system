import type { ChipProps } from '@mui/material';
import type { EmployeeProfileChangeRequestStatus } from '../types/profileChangeRequest.types';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';

type Props = {
  status: EmployeeProfileChangeRequestStatus;
  size?: ChipProps['size'];
};

export default function ProfileChangeRequestStatusChip({ status, size = 'small' }: Props) {
  return <StatusChip value={status} size={size} />;
}
