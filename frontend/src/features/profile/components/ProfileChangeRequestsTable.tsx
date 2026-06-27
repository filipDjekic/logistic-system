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
import { useCities } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import type { EmployeeProfileChangeRequestResponse } from '../types/profileChangeRequest.types';
import { formatProfileChangeFieldName, formatProfileChangeValue } from '../utils/profileChangeRequestFormatters';
import ProfileChangeRequestStatusChip from './ProfileChangeRequestStatusChip';

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

function RequestedChanges({
  request,
  countries,
  cities,
}: {
  request: EmployeeProfileChangeRequestResponse;
  countries?: ReturnType<typeof useActiveCountries>['data'];
  cities?: ReturnType<typeof useCities>['data'];
}) {
  const entries = Object.entries(request.requestedChanges ?? {});

  if (entries.length === 0) {
    return <Typography variant="body2" color="text.secondary">No change details.</Typography>;
  }

  return (
    <Stack spacing={0.5}>
      {entries.map(([field, value]) => (
        <Typography key={field} variant="body2">
          <Box component="span" sx={{ fontWeight: 700 }}>{formatProfileChangeFieldName(field)}:</Box>{' '}
          {formatProfileChangeValue(field, value, { countries, cities })}
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
  const countriesQuery = useActiveCountries();
  const citiesQuery = useCities();
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
              <TableCell><RequestedChanges request={request} countries={countriesQuery.data} cities={citiesQuery.data} /></TableCell>
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
