import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import type { EmployeeProfileChangeRequestStatus } from '../types/profileChangeRequest.types';

const STATUS_LABELS: Record<EmployeeProfileChangeRequestStatus, string> = {
  PENDING: 'Pending',
  APPLIED: 'Applied',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<EmployeeProfileChangeRequestStatus, ChipProps['color']> = {
  PENDING: 'warning',
  APPLIED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

type Props = {
  status: EmployeeProfileChangeRequestStatus;
  size?: ChipProps['size'];
};

export default function ProfileChangeRequestStatusChip({ status, size = 'small' }: Props) {
  return <Chip label={STATUS_LABELS[status] ?? status} color={STATUS_COLORS[status] ?? 'default'} size={size} />;
}
