import { useMemo } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { companyRegistrationApi } from '../api/companyRegistrationApi';
import { queryKeys } from '../../../core/constants/queryKeys';

function activeStep(status?: string) {
  if (status === 'APPROVED') return 3;
  if (status === 'REJECTED' || status === 'CANCELLED') return 2;
  if (status === 'UNDER_REVIEW') return 2;
  return 1;
}

export default function CompanyRegistrationStatusPage() {
  const params = useParams();
  const requestId = Number(params.requestId);
  const query = useQuery({
    queryKey: queryKeys.companyRegistrationRequests.publicStatus(requestId),
    queryFn: () => companyRegistrationApi.getPublicStatus(requestId),
    enabled: Number.isFinite(requestId) && requestId > 0,
    refetchInterval: 30000,
  });

  const statusColor = useMemo(() => {
    if (query.data?.status === 'APPROVED') return 'success';
    if (query.data?.status === 'REJECTED' || query.data?.status === 'CANCELLED') return 'error';
    return 'warning';
  }, [query.data?.status]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 5, background: 'linear-gradient(135deg, rgba(37,99,235,.08), rgba(15,118,110,.08))' }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 860, p: { xs: 2.5, md: 5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={3}>
          <Stack spacing={1} alignItems="center" textAlign="center">
            {query.data?.status === 'APPROVED' ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 54 }} /> : null}
            {query.data?.status === 'REJECTED' || query.data?.status === 'CANCELLED' ? <CancelOutlinedIcon color="error" sx={{ fontSize: 54 }} /> : null}
            {!query.data || query.data.status === 'SUBMITTED' || query.data.status === 'UNDER_REVIEW' ? <HourglassTopIcon color="warning" sx={{ fontSize: 54 }} /> : null}
            <Typography variant="h4" fontWeight={800}>Company request status</Typography>
            <Typography color="text.secondary">Request #{requestId} is tracked through the approval lifecycle.</Typography>
          </Stack>

          {query.isLoading ? <LinearProgress /> : null}
          {query.isError ? <Alert severity="error">Unable to load request status.</Alert> : null}

          <Alert severity="info">
            Save this request ID or bookmark this page. You can return to this address later to check whether the request is pending, under review, approved, or rejected.
          </Alert>

          {query.data ? (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Company</Typography>
                  <Typography variant="h6">{query.data.companyName}</Typography>
                  <Typography variant="body2" color="text.secondary">Administrator: {query.data.adminEmail}</Typography>
                </Box>
                <Chip label={query.data.status === 'SUBMITTED' ? 'PENDING REVIEW' : query.data.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : query.data.status} color={statusColor} sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', sm: 'center' } }} />
              </Stack>

              <Stepper activeStep={activeStep(query.data.status)} alternativeLabel sx={{ display: { xs: 'none', md: 'flex' } }}>
                {['Submitted', 'Pending review', 'Decision', 'Workspace activation'].map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
              </Stepper>

              <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
                {['Submitted', 'Pending review', 'Decision', 'Workspace activation'].map((label, index) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography fontWeight={700}>{index + 1}. {label}</Typography>
                  </Paper>
                ))}
              </Stack>

              {query.data.status === 'REJECTED' ? <Alert severity="error">Rejected reason: {query.data.rejectionReason ?? 'No reason provided.'}</Alert> : null}
              {query.data.status === 'APPROVED' ? <Alert severity="success">Approved. Company #{query.data.createdCompanyId ?? '—'} is active and the administrator can sign in.</Alert> : null}
              {query.data.status === 'SUBMITTED' ? <Alert severity="info">Your request is waiting for Overlord approval.</Alert> : null}
              {query.data.status === 'UNDER_REVIEW' ? <Alert severity="warning">Your request is under review. The final decision will appear on this page.</Alert> : null}

              <Stack direction="row" spacing={1} justifyContent="center">
                <Button component={RouterLink} to="/login" variant="contained">Go to login</Button>
                <Button component={RouterLink} to="/register-company" variant="outlined">New request</Button>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}
