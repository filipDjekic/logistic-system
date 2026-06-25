import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ProfileChangeRequestStatusChip from '../../profile/components/ProfileChangeRequestStatusChip';
import type { EmployeeProfileChangeRequestResponse } from '../types/employeeProfileChangeRequest.types';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function FieldChanges({ changes }: { changes: Record<string, unknown> }) {
  const entries = Object.entries(changes ?? {});
  if (!entries.length) {
    return <Typography color="text.secondary">No requested changes.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {entries.map(([field, value]) => (
        <Box key={field} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">{field}</Typography>
          <Typography variant="body2" fontWeight={700} textAlign="right">{formatValue(value)}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

export default function EmployeeProfileChangeRequestReviewDialog({
  open,
  request,
  action,
  processing,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  request: EmployeeProfileChangeRequestResponse | null;
  action: 'details' | 'approve' | 'reject';
  processing?: boolean;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, rejectionReason: string) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (open) setRejectionReason('');
  }, [open, request?.id]);

  const pending = request?.status === 'PENDING';
  const rejectDisabled = !request || !pending || rejectionReason.trim().length < 3 || processing;

  return (
    <Dialog open={open} onClose={processing ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {action === 'approve' ? 'Approve profile change request' : action === 'reject' ? 'Reject profile change request' : 'Profile change request details'}
      </DialogTitle>
      <DialogContent dividers>
        {!request ? null : (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={800}>{request.employeeFullName ?? `Employee #${request.employeeId}`}</Typography>
                <Typography variant="body2" color="text.secondary">Requested by {request.requestedByFullName ?? `User #${request.requestedByUserId}`}</Typography>
                <Typography variant="body2" color="text.secondary">Company: {request.companyName ?? '-'}</Typography>
              </Box>
              <ProfileChangeRequestStatusChip status={request.status} />
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary">Submitted</Typography>
                <Typography>{formatDateTime(request.createdAt)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary">Reviewed</Typography>
                <Typography>{formatDateTime(request.reviewedAt)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary">Reviewer</Typography>
                <Typography>{request.reviewedByFullName ?? '-'}</Typography>
              </Box>
            </Stack>

            {request.reason ? <Alert severity="info">Reason: {request.reason}</Alert> : null}
            {request.rejectionReason ? <Alert severity="error">Rejection reason: {request.rejectionReason}</Alert> : null}

            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Requested changes</Typography>
              <FieldChanges changes={request.requestedChanges} />
            </Box>

            {action === 'approve' && pending ? (
              <Alert severity="warning">Approval immediately applies the requested profile changes, writes audit history and notifies the employee.</Alert>
            ) : null}

            {action === 'reject' && pending ? (
              <TextField
                label="Rejection reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                fullWidth
                multiline
                minRows={3}
                inputProps={{ maxLength: 1000 }}
                helperText="Required. The employee will see this reason."
              />
            ) : null}

            {!pending && action !== 'details' ? <Alert severity="info">Only pending requests can be reviewed.</Alert> : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>Close</Button>
        {action === 'approve' && request ? (
          <Button variant="contained" color="success" disabled={!pending || processing} onClick={() => onApprove(request.id)}>
            Approve
          </Button>
        ) : null}
        {action === 'reject' && request ? (
          <Button variant="contained" color="error" disabled={rejectDisabled} onClick={() => onReject(request.id, rejectionReason.trim())}>
            Reject
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
