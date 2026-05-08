import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import {
  useApproveCompanyRegistration,
  useRejectCompanyRegistration,
} from '../hooks/useCompanyRegistrationMutations';
import { useCompanyRegistrationRequests } from '../hooks/useCompanyRegistrationRequests';
import type {
  CompanyRegistrationResponse,
  CompanyRegistrationStatus,
} from '../types/companyRegistration.types';

const statuses: Array<CompanyRegistrationStatus | ''> = ['', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'];

function statusColor(status: CompanyRegistrationStatus) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  if (status === 'CANCELLED') return 'default';
  return 'warning';
}

export default function CompanyRegistrationRequestsPage() {
  const [status, setStatus] = useState<CompanyRegistrationStatus | ''>('SUBMITTED');
  const [selected, setSelected] = useState<CompanyRegistrationResponse | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CompanyRegistrationResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const requestsQuery = useCompanyRegistrationRequests(status);
  const approveMutation = useApproveCompanyRegistration();
  const rejectMutation = useRejectCompanyRegistration();

  const rows = requestsQuery.data ?? [];

  const columns = useMemo<DataTableColumn<CompanyRegistrationResponse>[]>(() => [
    { id: 'id', header: 'ID', minWidth: 80, render: (row) => row.id },
    {
      id: 'companyName',
      header: 'Company',
      minWidth: 240,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>{row.companyName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.companyEmail ?? '—'}</Typography>
        </Stack>
      ),
    },
    {
      id: 'adminEmail',
      header: 'Admin',
      minWidth: 240,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>{row.adminFirstName} {row.adminLastName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.adminEmail}</Typography>
        </Stack>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      minWidth: 220,
      render: (row) => `${row.countryName ?? '—'} / ${row.cityName ?? '—'}`,
    },
    {
      id: 'status',
      header: 'Status',
      minWidth: 140,
      render: (row) => <Chip size="small" label={row.status} color={statusColor(row.status)} />,
    },
    {
      id: 'submittedAt',
      header: 'Submitted',
      minWidth: 180,
      render: (row) => new Date(row.submittedAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      sticky: 'right',
      align: 'right',
      minWidth: 260,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" variant="text" onClick={() => setSelected(row)}>View</Button>
          <Button
            size="small"
            variant="contained"
            disabled={row.status !== 'SUBMITTED' || approveMutation.isPending}
            onClick={() => approveMutation.mutate(row.id)}
          >
            Approve
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            disabled={row.status !== 'SUBMITTED' || rejectMutation.isPending}
            onClick={() => { setRejectTarget(row); setRejectionReason(''); }}
          >
            Reject
          </Button>
        </Stack>
      ),
    },
  ], [approveMutation, rejectMutation]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Organization onboarding"
        title="Company registration requests"
        description="Review submitted company onboarding requests and approve or reject creation of the company bootstrap account."
      />

      <SectionCard
        title="Requests"
        action={
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CompanyRegistrationStatus | '')}
            sx={{ minWidth: 220 }}
          >
            {statuses.map((option) => (
              <MenuItem key={option || 'ALL'} value={option}>{option || 'ALL'}</MenuItem>
            ))}
          </TextField>
        }
      >
        {requestsQuery.isError ? <Alert severity="error">Unable to load registration requests.</Alert> : null}
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          loading={requestsQuery.isLoading}
          error={requestsQuery.isError}
          onRetry={() => requestsQuery.refetch()}
          emptyTitle="No registration requests"
          emptyDescription="There are no requests for the selected status."
          minWidth={1300}
        />
      </SectionCard>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>Registration request details</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={1.25}>
              <Typography><strong>Company:</strong> {selected.companyName}</Typography>
              <Typography><strong>Registration number:</strong> {selected.registrationNumber ?? '—'}</Typography>
              <Typography><strong>Tax number:</strong> {selected.taxNumber ?? '—'}</Typography>
              <Typography><strong>Company email:</strong> {selected.companyEmail ?? '—'}</Typography>
              <Typography><strong>Company phone:</strong> {selected.companyPhoneNumber ?? '—'}</Typography>
              <Typography><strong>Location:</strong> {selected.countryName ?? '—'} / {selected.cityName ?? '—'}</Typography>
              <Typography><strong>Timezone:</strong> {selected.timezoneDisplayName ?? selected.timezoneName ?? '—'}</Typography>
              <Typography><strong>Address:</strong> {selected.address ?? '—'}</Typography>
              <Typography><strong>Admin:</strong> {selected.adminFirstName} {selected.adminLastName}</Typography>
              <Typography><strong>Admin email:</strong> {selected.adminEmail}</Typography>
              <Typography><strong>Admin phone:</strong> {selected.adminPhoneNumber}</Typography>
              <Typography><strong>Admin JMBG:</strong> {selected.adminJmbg}</Typography>
              <Typography><strong>Admin employment date:</strong> {selected.adminEmploymentDate}</Typography>
              <Typography><strong>Status:</strong> {selected.status}</Typography>
              <Typography><strong>Notes:</strong> {selected.notes ?? '—'}</Typography>
              <Typography><strong>Rejection reason:</strong> {selected.rejectionReason ?? '—'}</Typography>
              <Typography><strong>Created company ID:</strong> {selected.createdCompanyId ?? '—'}</Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject registration request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Add a reason for rejecting {rejectTarget?.companyName ?? 'this request'}.
            </Typography>
            <TextField
              label="Rejection reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || !rejectTarget || rejectMutation.isPending}
            onClick={() => {
              if (!rejectTarget) return;
              rejectMutation.mutate({ id: rejectTarget.id, rejectionReason }, {
                onSuccess: () => setRejectTarget(null),
              });
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
