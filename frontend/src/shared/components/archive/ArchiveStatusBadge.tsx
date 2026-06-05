import { Chip } from '@mui/material';

type ArchiveStatusBadgeProps = {
  archived: boolean;
  size?: 'small' | 'medium';
};

export default function ArchiveStatusBadge({ archived, size = 'small' }: ArchiveStatusBadgeProps) {
  return (
    <Chip
      size={size}
      label={archived ? 'Archived' : 'Active'}
      color={archived ? 'default' : 'success'}
      variant={archived ? 'outlined' : 'filled'}
    />
  );
}
