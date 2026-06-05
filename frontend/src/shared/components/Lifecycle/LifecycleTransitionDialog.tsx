import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import StatusChip from '../StatusChip/StatusChip';

type LifecycleTransitionDialogProps<TStatus extends string> = {
  open: boolean;
  entityLabel: string;
  fromStatus: TStatus;
  toStatus: TStatus | null;
  loading?: boolean;
  optimisticVersion?: number;
  consequences?: string[];
  warnings?: string[];
  requireReason?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

function humanizeStatus(value: string | null | undefined) {
  return value ? value.replaceAll('_', ' ').toLowerCase() : 'unknown';
}

function getDefaultConsequences(entityLabel: string, fromStatus: string, toStatus: string | null) {
  const label = entityLabel.toLowerCase();

  if (!toStatus) {
    return [];
  }

  if (label.includes('transport')) {
    const map: Record<string, string[]> = {
      ASSIGNED: ['Vehicle and driver assignment become part of the active operational plan.', 'The order becomes ready for warehouse preparation tasks.'],
      PICKING: ['Warehouse preparation starts and picking work should be visible to operational users.', 'Inventory availability and assigned tasks should be reviewed before continuing.'],
      PACKING: ['Picked goods move into packing preparation.', 'Open picking work should be completed or explicitly handled before this transition.'],
      READY_FOR_LOADING: ['The order is marked ready for loading.', 'Loading tasks and vehicle readiness become the next operational focus.'],
      LOADING: ['Loading is now active.', 'Warehouse users should confirm loading progress before departure.'],
      IN_TRANSIT: ['The delivery leaves warehouse control and moves into driver execution.', 'Vehicle availability is expected to be occupied until the transport reaches a terminal state.'],
      DELIVERED: ['The transport reaches a successful terminal state.', 'Related operational work should be completed and inventory delivery effects should already be consistent.'],
      FAILED: ['The transport reaches an exception terminal state.', 'Follow-up review, comments and possible rescheduling are expected.'],
      RETURNING: ['The transport enters return handling.', 'Returned goods and warehouse receiving work should be reviewed.'],
      RESCHEDULED: ['The transport plan changes and needs operational review.', 'Dates, assignments and dependent tasks should be checked.'],
      CANCELLED: ['The transport reaches a cancelled terminal state.', 'Open reservations, tasks and assignments should no longer continue as normal operations.'],
    };
    return map[toStatus] ?? [`Transport order changes from ${humanizeStatus(fromStatus)} to ${humanizeStatus(toStatus)}.`];
  }

  if (label.includes('task')) {
    const map: Record<string, string[]> = {
      OPEN: ['The task becomes available for operational execution.'],
      ASSIGNED: ['The selected employee is expected to take ownership of this task.'],
      IN_PROGRESS: ['The task is actively being executed.', 'Due date and linked process progress should now be monitored.'],
      BLOCKED: ['The task is marked as blocked and should appear as an operational exception.', 'A clear reason is important so another user knows what is preventing execution.'],
      COMPLETED: ['The task reaches a successful terminal state.', 'Linked transport or stock process can continue to the next step.'],
      CANCELLED: ['The task reaches a cancelled terminal state.', 'Linked process owners should verify whether replacement work is needed.'],
    };
    return map[toStatus] ?? [`Task changes from ${humanizeStatus(fromStatus)} to ${humanizeStatus(toStatus)}.`];
  }

  if (label.includes('vehicle')) {
    const map: Record<string, string[]> = {
      AVAILABLE: ['The vehicle can be assigned to new transport work.'],
      RESERVED: ['The vehicle is held for planned transport and should not be treated as freely available.'],
      IN_USE: ['The vehicle is occupied by active operational work.'],
      MAINTENANCE: ['The vehicle should be excluded from normal transport assignment.', 'Maintenance context should be checked before returning it to available.'],
      OUT_OF_SERVICE: ['The vehicle is removed from operational availability.', 'Existing assignments should be reviewed before confirming this transition.'],
    };
    return map[toStatus] ?? [`Vehicle changes from ${humanizeStatus(fromStatus)} to ${humanizeStatus(toStatus)}.`];
  }

  if (label.includes('warehouse')) {
    const map: Record<string, string[]> = {
      ACTIVE: ['The warehouse can be used for normal inventory and transport operations.'],
      INACTIVE: ['The warehouse should not be used for new operational work.', 'Existing inventory, tasks and transport references should be reviewed.'],
      FULL: ['The warehouse should be treated as capacity constrained.', 'Inbound receiving and destination planning should be reviewed.'],
      UNDER_MAINTENANCE: ['The warehouse should be restricted for normal operations.', 'Open tasks, bin activity and transport plans should be checked before confirming.'],
    };
    return map[toStatus] ?? [`Warehouse changes from ${humanizeStatus(fromStatus)} to ${humanizeStatus(toStatus)}.`];
  }

  return [`Status changes from ${humanizeStatus(fromStatus)} to ${humanizeStatus(toStatus)}.`];
}

function getDefaultWarnings(entityLabel: string, toStatus: string | null) {
  const label = entityLabel.toLowerCase();

  if (!toStatus) {
    return [];
  }

  if (['DELIVERED', 'FAILED', 'CANCELLED', 'COMPLETED'].includes(toStatus)) {
    return ['This is a terminal or near-terminal workflow step. Confirm that dependent work is already consistent.'];
  }

  if (label.includes('warehouse') && ['INACTIVE', 'UNDER_MAINTENANCE', 'FULL'].includes(toStatus)) {
    return ['This status can affect future inventory, bin and transport operations.'];
  }

  if (label.includes('vehicle') && ['MAINTENANCE', 'OUT_OF_SERVICE'].includes(toStatus)) {
    return ['This status can remove the vehicle from assignment workflows.'];
  }

  if (label.includes('task') && toStatus === 'BLOCKED') {
    return ['Blocked tasks should include a concrete reason so another user can resolve the obstruction.'];
  }

  return [];
}

export default function LifecycleTransitionDialog<TStatus extends string>({
  open,
  entityLabel,
  fromStatus,
  toStatus,
  loading = false,
  optimisticVersion,
  consequences,
  warnings,
  requireReason = false,
  onClose,
  onConfirm,
}: LifecycleTransitionDialogProps<TStatus>) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const effectiveConsequences = useMemo(
    () => consequences?.length ? consequences : getDefaultConsequences(entityLabel, fromStatus, toStatus),
    [consequences, entityLabel, fromStatus, toStatus],
  );

  const effectiveWarnings = useMemo(
    () => warnings?.length ? warnings : getDefaultWarnings(entityLabel, toStatus),
    [warnings, entityLabel, toStatus],
  );

  const reasonRequired = requireReason || effectiveWarnings.length > 0;
  const reasonValid = !reasonRequired || reason.trim().length >= 3;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Confirm lifecycle transition</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Typography color="text.secondary">
            This action moves {entityLabel} through the operational lifecycle. Review the expected effects before confirming.
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <StatusChip value={fromStatus} />
            <Typography color="text.secondary">→</Typography>
            {toStatus ? <StatusChip value={toStatus} /> : <StatusChip value="UNKNOWN" />}
          </Stack>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              Expected system effect
            </Typography>
            <List dense disablePadding>
              {effectiveConsequences.map((item) => (
                <ListItem key={item} disableGutters sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                    <InfoOutlinedIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </Box>

          {effectiveWarnings.length > 0 ? (
            <Alert severity="warning">
              <Stack spacing={0.75}>
                {effectiveWarnings.map((item) => (
                  <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                    <ReportProblemOutlinedIcon fontSize="small" />
                    <Typography variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Alert>
          ) : null}

          {optimisticVersion != null ? (
            <Alert severity="info">
              Current version: {optimisticVersion}. If another user changed this entity first, the backend will reject this transition.
            </Alert>
          ) : null}

          <Divider />

          <TextField
            label={reasonRequired ? 'Transition reason required' : 'Transition reason'}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={3}
            fullWidth
            inputProps={{ maxLength: 500 }}
            helperText={reasonRequired ? `${reason.length}/500 characters. Enter at least 3 characters for this transition.` : `${reason.length}/500 characters`}
            placeholder="Example: loading completed and driver confirmed departure."
            disabled={loading}
            error={reasonRequired && reason.trim().length > 0 && !reasonValid}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(reason.trim())}
          disabled={!toStatus || loading || !reasonValid}
        >
          Confirm transition
        </Button>
      </DialogActions>
    </Dialog>
  );
}
