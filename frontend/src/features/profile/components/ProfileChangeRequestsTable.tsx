import {
  Alert,
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { EmployeeProfileChangeRequestResponse } from '../types/profileChangeRequest.types';
import ProfileChangeRequestStatusChip from './ProfileChangeRequestStatusChip';

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

function formatFieldName(field: string) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function RequestedChanges({ request }: { request: EmployeeProfileChangeRequestResponse }) {
  const entries = Object.entries(request.requestedChanges ?? {});

  if (entries.length === 0) {
    return <Typography variant="body2" color="text.secondary">No change details.</Typography>;
  }

  return (
    <Stack spacing={0.5}>
      {entries.map(([field, value]) => (
        <Typography key={field} variant="body2">
          <Box component="span" sx={{ fontWeight: 700 }}>{formatFieldName(field)}:</Box>{' '}
          {formatValue(value)}
        </Typography>
      ))}
    </Stack>
  );
}

type Props = {
  requests: EmployeeProfileChangeRequestResponse[];
  isLoading?: boolean;
  error?: unknown;
};

export default function ProfileChangeRequestsTable({ requests, isLoading = false, error }: Props) {
  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={64} />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">Profile change requests could not be loaded.</Alert>;
  }

  if (requests.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>No profile change requests</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Requests you submit for profile updates will appear here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Submitted</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requested changes</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Reviewed</TableCell>
            <TableCell>Reviewer note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} hover>
              <TableCell>{formatDateTime(request.createdAt)}</TableCell>
              <TableCell><ProfileChangeRequestStatusChip status={request.status} /></TableCell>
              <TableCell><RequestedChanges request={request} /></TableCell>
              <TableCell>{request.reason || '-'}</TableCell>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography variant="body2">{request.reviewedByFullName || '-'}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDateTime(request.reviewedAt)}</Typography>
                </Stack>
              </TableCell>
              <TableCell>{request.rejectionReason || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
