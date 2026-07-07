import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
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

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Profile Change Requests</Typography>
          <Typography variant="body2" color="text.secondary">
            Review employee profile change requests submitted from My Profile.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Selected status</Typography>
              <Typography variant="h5" fontWeight={850}>{status || 'ALL'}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Visible pending</Typography>
              <Typography variant="h5" fontWeight={850}>{pendingCount}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Total results</Typography>
              <Typography variant="h5" fontWeight={850}>{query.data?.totalElements ?? 0}</Typography>
            </CardContent>
          </Card>
        </Stack>

        <Card>
          <CardContent>
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

              {query.isLoading ? <LinearProgress /> : null}
              {query.isError ? <Alert severity="error">Profile change requests could not be loaded.</Alert> : null}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Changes</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Reviewed</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => {
                      const pending = request.status === 'PENDING';
                      return (
                        <TableRow key={request.id} hover>
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={700}>{request.employeeFullName ?? `Employee #${request.employeeId}`}</Typography>
                              <Typography variant="caption" color="text.secondary">Requested by {request.requestedByFullName ?? `User #${request.requestedByUserId}`}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{request.companyName ?? '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={formatProfileChangeSummary(request.requestedChanges, { countries: countriesQuery.data, cities: citiesQuery.data })}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell><ProfileChangeRequestStatusChip status={request.status} /></TableCell>
                          <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                          <TableCell>{formatDateTime(request.reviewedAt)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Details">
                              <IconButton size="small" onClick={() => openDialog(request, 'details')}>
                                <VisibilityRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Approve">
                              <span>
                                <IconButton size="small" color="success" disabled={!pending} onClick={() => openDialog(request, 'approve')}>
                                  <CheckCircleRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <span>
                                <IconButton size="small" color="error" disabled={!pending} onClick={() => openDialog(request, 'reject')}>
                                  <CancelRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!requests.length && !query.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Alert severity="info">No profile change requests match the selected filters.</Alert>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={query.data?.totalElements ?? 0}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={size}
                onRowsPerPageChange={(event) => {
                  setSize(Number(event.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </Stack>
          </CardContent>
        </Card>
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
