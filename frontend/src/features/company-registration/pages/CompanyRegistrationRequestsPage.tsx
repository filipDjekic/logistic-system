import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import {
  useApproveCompanyRegistration,
  useMarkCompanyRegistrationUnderReview,
  useRejectCompanyRegistration,
} from '../hooks/useCompanyRegistrationMutations';
import { useCompanyRegistrationRequests } from '../hooks/useCompanyRegistrationRequests';
import type { CompanyRegistrationResponse, CompanyRegistrationStatus } from '../types/companyRegistration.types';

const statuses: Array<CompanyRegistrationStatus | ''> = ['', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];
const lifecycleSteps: CompanyRegistrationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

function statusColor(status: CompanyRegistrationStatus) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'error';
  if (status === 'UNDER_REVIEW') return 'info';
  return 'warning';
}

function statusLabel(status: CompanyRegistrationStatus) {
  if (status === 'SUBMITTED') return 'PENDING REVIEW';
  if (status === 'UNDER_REVIEW') return 'UNDER REVIEW';
  return status;
}

function lifecycleStepIndex(status: CompanyRegistrationStatus) {
  if (status === 'SUBMITTED') return 0;
  if (status === 'UNDER_REVIEW') return 1;
  if (status === 'APPROVED') return 2;
  return 1;
}

function canMoveToReview(row: CompanyRegistrationResponse) {
  return row.canMoveToReview ?? (row.status === 'SUBMITTED');
}

function canApprove(row: CompanyRegistrationResponse) {
  return row.canApprove ?? (row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW');
}

function canReject(row: CompanyRegistrationResponse) {
  return row.canReject ?? (row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW');
}

function InfoCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            {icon}
            <Typography fontWeight={900}>{title}</Typography>
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} textAlign="right" sx={{ overflowWrap: 'anywhere' }}>{value || '—'}</Typography>
    </Stack>
  );
}

function StatusLifecycle({ request }: { request: CompanyRegistrationResponse }) {
  const isRejected = request.status === 'REJECTED' || request.status === 'CANCELLED';

  if (isRejected) {
    return (
      <Alert severity="error" icon={<ReportProblemIcon />}>
        Request ended as {statusLabel(request.status)}{request.rejectionReason ? `: ${request.rejectionReason}` : '.'}
      </Alert>
    );
  }

  return (
    <Stepper activeStep={lifecycleStepIndex(request.status)} alternativeLabel sx={{ px: { xs: 0, sm: 2 } }}>
      {lifecycleSteps.map((step) => (
        <Step key={step} completed={lifecycleStepIndex(request.status) > lifecycleStepIndex(step)}>
          <StepLabel>{statusLabel(step)}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export default function CompanyRegistrationRequestsPage() {
  const [status, setStatus] = useState<CompanyRegistrationStatus | ''>('SUBMITTED');
  const [selected, setSelected] = useState<CompanyRegistrationResponse | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CompanyRegistrationResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const requestsQuery = useCompanyRegistrationRequests(status);
  const markUnderReviewMutation = useMarkCompanyRegistrationUnderReview();
  const approveMutation = useApproveCompanyRegistration();
  const rejectMutation = useRejectCompanyRegistration();
  const rows = requestsQuery.data ?? [];
  const pendingCount = rows.filter((row) => row.status === 'SUBMITTED').length;
  const reviewCount = rows.filter((row) => row.status === 'UNDER_REVIEW').length;
  const decidedCount = rows.filter((row) => row.status === 'APPROVED' || row.status === 'REJECTED').length;

  const handleMoveToReview = (request: CompanyRegistrationResponse) => {
    markUnderReviewMutation.mutate(request.id, { onSuccess: (updated) => setSelected(updated) });
  };

  const handleApprove = (request: CompanyRegistrationResponse) => {
    approveMutation.mutate(request.id, { onSuccess: (updated) => setSelected(updated) });
  };

  const openRejectDialog = (request: CompanyRegistrationResponse) => {
    setRejectTarget(request);
    setRejectionReason(request.rejectionReason ?? '');
  };

  const columns = useMemo<DataTableColumn<CompanyRegistrationResponse>[]>(() => [
    { id: 'id', header: 'Request', minWidth: 110, render: (row) => `#${row.id}` },
    {
      id: 'companyName',
      header: 'Company preview',
      minWidth: 280,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={900}>{row.companyName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.registrationNumber ?? 'No registration number'} · {row.taxNumber ?? 'No tax number'}</Typography>
        </Stack>
      ),
    },
    {
      id: 'adminEmail',
      header: 'Administrator',
      minWidth: 240,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>{row.adminFirstName} {row.adminLastName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.adminEmail}</Typography>
        </Stack>
      ),
    },
    { id: 'location', header: 'Location', minWidth: 220, render: (row) => `${row.countryName ?? '—'} / ${row.cityName ?? '—'}` },
    {
      id: 'status',
      header: 'Lifecycle',
      minWidth: 180,
      render: (row) => <Chip size="small" label={row.statusLabel ?? statusLabel(row.status)} color={statusColor(row.status)} sx={{ fontWeight: 900 }} />,
    },
    { id: 'submittedAt', header: 'Submitted', minWidth: 180, render: (row) => new Date(row.submittedAt).toLocaleString() },
    {
      id: 'actions',
      header: 'Review',
      sticky: 'right',
      align: 'right',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" variant="outlined" onClick={() => setSelected(row)}>Open review</Button>
          <Button size="small" variant="contained" disabled={!canApprove(row) || approveMutation.isPending} onClick={() => handleApprove(row)}>Approve</Button>
        </Stack>
      ),
    },
  ], [approveMutation.isPending]);

  return (
    <Stack spacing={3}>
      <PageHeader overline="Tenant onboarding" title="Company approval queue" description="Review company onboarding requests before workspace activation." />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <InfoCard title="Pending review" icon={<HourglassTopIcon color="warning" />}>
          <Typography variant="h4" fontWeight={950}>{pendingCount}</Typography>
          <Typography variant="body2" color="text.secondary">Requests waiting for an overlord to start review.</Typography>
        </InfoCard>
        <InfoCard title="Under review" icon={<FactCheckIcon color="info" />}>
          <Typography variant="h4" fontWeight={950}>{reviewCount}</Typography>
          <Typography variant="body2" color="text.secondary">Requests currently being checked before approval.</Typography>
        </InfoCard>
        <InfoCard title="Decided" icon={<CheckCircleIcon color="success" />}>
          <Typography variant="h4" fontWeight={950}>{decidedCount}</Typography>
          <Typography variant="body2" color="text.secondary">Approved or rejected requests in the selected view.</Typography>
        </InfoCard>
      </Box>

      <SectionCard
        title="Requests"
        action={(
          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as CompanyRegistrationStatus | '')} sx={{ minWidth: 220 }}>
            {statuses.map((option) => <MenuItem key={option || 'ALL'} value={option}>{option ? statusLabel(option) : 'ALL'}</MenuItem>)}
          </TextField>
        )}
      >
        {requestsQuery.isError ? <Alert severity="error">Unable to load registration requests.</Alert> : null}
        <DataTable columns={columns} rows={rows} getRowId={(row) => row.id} loading={requestsQuery.isLoading} error={requestsQuery.isError} onRetry={() => requestsQuery.refetch()} emptyTitle="No registration requests" emptyDescription="There are no requests for the selected status." minWidth={1380} />
      </SectionCard>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', md: 720 }, p: { xs: 2, sm: 3 } } }}>
        {selected ? (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">Request #{selected.id}</Typography>
                <Typography variant="h5" fontWeight={950}>{selected.companyName}</Typography>
                <Typography variant="body2" color="text.secondary">{selected.statusDescription ?? 'Review company, location and administrator data before making a decision.'}</Typography>
              </Box>
              <Chip label={selected.statusLabel ?? statusLabel(selected.status)} color={statusColor(selected.status)} sx={{ fontWeight: 900 }} />
            </Stack>

            <StatusLifecycle request={selected} />
            <Divider />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <InfoCard title="Company" icon={<BusinessIcon color="primary" />}>
                <Row label="Name" value={selected.companyName} />
                <Row label="Registration" value={selected.registrationNumber} />
                <Row label="Tax" value={selected.taxNumber} />
                <Row label="Email" value={selected.companyEmail} />
                <Row label="Phone" value={selected.companyPhoneNumber} />
              </InfoCard>
              <InfoCard title="Location" icon={<PlaceIcon color="primary" />}>
                <Row label="Country" value={selected.countryName} />
                <Row label="City" value={selected.cityName} />
                <Row label="Timezone" value={selected.timezoneDisplayName ?? selected.timezoneName} />
                <Row label="Address" value={selected.address} />
                <Row label="Postal code" value={selected.postalCode} />
              </InfoCard>
              <InfoCard title="Administrator" icon={<PersonIcon color="primary" />}>
                <Row label="Name" value={`${selected.adminFirstName} ${selected.adminLastName}`} />
                <Row label="Email" value={selected.adminEmail} />
                <Row label="Phone" value={selected.adminPhoneNumber} />
                <Row label="JMBG" value={selected.adminJmbg} />
                <Row label="Employment date" value={selected.adminEmploymentDate} />
              </InfoCard>
              <InfoCard title="Decision" icon={<FactCheckIcon color="primary" />}>
                <Row label="Submitted" value={new Date(selected.submittedAt).toLocaleString()} />
                <Row label="Reviewed" value={selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : null} />
                <Row label="Reviewed by" value={selected.reviewedByEmail} />
                <Row label="Created company" value={selected.createdCompanyId} />
                <Row label="Rejection reason" value={selected.rejectionReason} />
              </InfoCard>
            </Box>

            {selected.notes ? <Alert severity="info">Applicant note: {selected.notes}</Alert> : null}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent="flex-end"
              sx={{
                position: { xs: 'sticky', sm: 'static' },
                bottom: 0,
                bgcolor: 'background.paper',
                borderTop: { xs: 1, sm: 0 },
                borderColor: 'divider',
                py: { xs: 2, sm: 0 },
              }}
            >
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button variant="outlined" disabled={!canMoveToReview(selected) || markUnderReviewMutation.isPending} onClick={() => handleMoveToReview(selected)}>Mark under review</Button>
              <Button variant="contained" disabled={!canApprove(selected) || approveMutation.isPending} onClick={() => handleApprove(selected)}>Approve</Button>
              <Button color="error" variant="outlined" disabled={!canReject(selected)} onClick={() => openRejectDialog(selected)}>Reject</Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>

      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject registration request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {rejectTarget ? (
              <Alert severity="warning">
                Rejecting #{rejectTarget.id} for {rejectTarget.companyName}. The reason will be visible on the public status page.
              </Alert>
            ) : null}
            <TextField
              label="Rejection reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              multiline
              minRows={4}
              fullWidth
              required
              error={Boolean(rejectionReason) && rejectionReason.trim().length < 10}
              helperText="Use a clear reason with at least 10 characters."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={rejectionReason.trim().length < 10 || !rejectTarget || rejectMutation.isPending}
            onClick={() => {
              if (!rejectTarget) return;
              rejectMutation.mutate({ id: rejectTarget.id, rejectionReason: rejectionReason.trim() }, {
                onSuccess: (updated) => {
                  setRejectTarget(null);
                  setSelected(updated);
                },
              });
            }}
          >
            Reject request
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
