import {
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { useCities } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import type { EmployeeProfileChangeRequestResponse } from '../types/profileChangeRequest.types';
import { formatProfileChangeFieldName, formatProfileChangeValue } from '../utils/profileChangeRequestFormatters';
import ProfileChangeRequestStatusChip from './ProfileChangeRequestStatusChip';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';

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
  const columns: DataTableColumn<EmployeeProfileChangeRequestResponse>[] = [
    { id: 'submitted', header: 'Submitted', render: (request) => formatDateTime(request.createdAt) },
    { id: 'status', header: 'Status', render: (request) => <ProfileChangeRequestStatusChip status={request.status} /> },
    { id: 'changes', header: 'Requested changes', render: (request) => <RequestedChanges request={request} countries={countriesQuery.data} cities={citiesQuery.data} /> },
    { id: 'reason', header: 'Reason', render: (request) => request.reason || '-' },
    { id: 'reviewed', header: 'Reviewed', render: (request) => <Stack spacing={0.25}><Typography variant="body2">{request.reviewedByFullName || '-'}</Typography><Typography variant="caption" color="text.secondary">{formatDateTime(request.reviewedAt)}</Typography></Stack> },
    { id: 'note', header: 'Reviewer note', render: (request) => request.rejectionReason || '-' },
  ];

  return <DataTable columns={columns} rows={requests} getRowId={(request) => request.id} size="small" stickyHeader={false} enableClientWindowing={false} loading={isLoading} error={Boolean(error)} errorTitle="Profile change requests could not be loaded." emptyTitle="No profile change requests" emptyDescription="Requests you submit for profile updates will appear here." />;
}
