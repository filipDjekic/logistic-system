import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PageContainer from '../../../app/layout/PageContainer';
import { useCities } from '../../cities/hooks/useCities';
import { useActiveCountries } from '../../countries/hooks/useCountries';
import ProfileChangeRequestStatusChip from '../../profile/components/ProfileChangeRequestStatusChip';
import { formatProfileChangeSummary } from '../../profile/utils/profileChangeRequestFormatters';
import { profileChangeRequestStatuses } from '../api/employeeProfileChangeRequestsApi';
import { useEmployeeProfileChangeRequests } from '../hooks/useEmployeeProfileChangeRequests';
import {
  useApproveEmployeeProfileChangeRequest,
  useRejectEmployeeProfileChangeRequest,
} from '../hooks/useReviewEmployeeProfileChangeRequest';
import EmployeeProfileChangeRequestReviewDialog from '../components/EmployeeProfileChangeRequestReviewDialog';
import type {
  EmployeeProfileChangeRequestResponse,
  EmployeeProfileChangeRequestStatus,
} from '../types/employeeProfileChangeRequest.types';
import DataTable from '../../../shared/components/DataTable/DataTable';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import type { DataTableColumn } from '../../../shared/types/common.types';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function EmployeeProfileChangeRequestsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [status, setStatus] = useState<EmployeeProfileChangeRequestStatus | ''>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<EmployeeProfileChangeRequestResponse | null>(null);
  const [dialogAction, setDialogAction] = useState<'details' | 'approve' | 'reject'>('details');

  const params = useMemo(() => ({ page, size, sort: 'createdAt,desc', status }), [page, size, status]);
  const query = useEmployeeProfileChangeRequests(params);
  const countriesQuery = useActiveCountries();
  const citiesQuery = useCities();
  const approveMutation = useApproveEmployeeProfileChangeRequest();
  const rejectMutation = useRejectEmployeeProfileChangeRequest();

  const requests = query.data?.content ?? [];
  const processing = approveMutation.isPending || rejectMutation.isPending;

  const openDialog = (request: EmployeeProfileChangeRequestResponse, action: 'details' | 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDialogAction(action);
  };

  const closeDialog = () => {
    if (processing) return;
    setSelectedRequest(null);
    setDialogAction('details');
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate(id, { onSuccess: closeDialog });
  };

  const handleReject = (id: number, rejectionReason: string) => {
    rejectMutation.mutate({ id, rejectionReason }, { onSuccess: closeDialog });
  };

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const columns: DataTableColumn<EmployeeProfileChangeRequestResponse>[] = [
    { id: 'employee', header: 'Employee', render: (request) => <Stack spacing={0.25}><Typography variant="body2" fontWeight={700}>{request.employeeFullName ?? `Employee #${request.employeeId}`}</Typography><Typography variant="caption" color="text.secondary">Requested by {request.requestedByFullName ?? `User #${request.requestedByUserId}`}</Typography></Stack> },
    { id: 'company', header: 'Company', render: (request) => request.companyName ?? '-' },
    { id: 'changes', header: 'Changes', render: (request) => <Chip label={formatProfileChangeSummary(request.requestedChanges, { countries: countriesQuery.data, cities: citiesQuery.data })} size="small" variant="outlined" /> },
    { id: 'status', header: 'Status', render: (request) => <ProfileChangeRequestStatusChip status={request.status} /> },
    { id: 'submitted', header: 'Submitted', render: (request) => formatDateTime(request.createdAt) },
    { id: 'reviewed', header: 'Reviewed', render: (request) => formatDateTime(request.reviewedAt) },
    { id: 'actions', header: 'Actions', align: 'right', render: (request) => { const pending = request.status === 'PENDING'; return <><Tooltip title="Details"><IconButton aria-label="View request details" size="small" onClick={() => openDialog(request, 'details')}><VisibilityRoundedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Approve"><span><IconButton aria-label="Approve request" size="small" color="success" disabled={!pending} onClick={() => openDialog(request, 'approve')}><CheckCircleRoundedIcon fontSize="small" /></IconButton></span></Tooltip><Tooltip title="Reject"><span><IconButton aria-label="Reject request" size="small" color="error" disabled={!pending} onClick={() => openDialog(request, 'reject')}><CancelRoundedIcon fontSize="small" /></IconButton></span></Tooltip></>; } },
  ];

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <PageHeader title="Profile Change Requests" description="Review employee profile change requests submitted from My Profile." />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}><StatCard title="Selected status" value={status || 'ALL'} /></Box>
          <Box sx={{ flex: 1 }}><StatCard title="Visible pending" value={pendingCount} accent="warning" /></Box>
          <Box sx={{ flex: 1 }}><StatCard title="Total results" value={query.data?.totalElements ?? 0} /></Box>
        </Stack>

        <SectionCard>
          <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Requests</Typography>
                </Box>
                <TextField
                  select
                  label="Status"
                  size="small"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as EmployeeProfileChangeRequestStatus | '');
                    setPage(0);
                  }}
                  sx={{ minWidth: 220 }}
                >
                  {profileChangeRequestStatuses.map((option) => (
                    <MenuItem key={option || 'ALL'} value={option}>{option || 'ALL'}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <DataTable columns={columns} rows={requests} getRowId={(request) => request.id} size="small" loading={query.isLoading} error={query.isError} errorTitle="Profile change requests could not be loaded." emptyTitle="No profile change requests" emptyDescription="No profile change requests match the selected filters." pagination={<ServerTablePagination page={query.data} disabled={query.isFetching} onPageChange={setPage} onSizeChange={(value) => { setSize(value); setPage(0); }} />} />
          </Stack>
        </SectionCard>
      </Stack>

      <EmployeeProfileChangeRequestReviewDialog
        open={Boolean(selectedRequest)}
        request={selectedRequest}
        action={dialogAction}
        processing={processing}
        onClose={closeDialog}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </PageContainer>
  );
}
