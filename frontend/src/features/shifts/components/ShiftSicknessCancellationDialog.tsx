import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function ShiftSicknessCancellationDialog({ open, loading = false, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const trimmedReason = reason.trim();

  const close = () => {
    if (loading) return;
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Cancel shift due to sickness</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={3}
          margin="normal"
          label="Reason"
          value={reason}
          error={reason.length > 0 && trimmedReason.length === 0}
          helperText={reason.length > 0 && trimmedReason.length === 0 ? 'Reason cannot be blank.' : 'Explain why the employee cannot continue or take the shift.'}
          inputProps={{ maxLength: 255 }}
          onChange={(event) => setReason(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={loading}>Back</Button>
        <Button
          variant="contained"
          color="warning"
          disabled={loading || trimmedReason.length === 0}
          onClick={() => onConfirm(trimmedReason)}
        >
          Cancel due to sickness
        </Button>
      </DialogActions>
    </Dialog>
  );
}
