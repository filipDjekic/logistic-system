import type { ReactNode } from 'react';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';

type FormActionsProps = {
  cancelLabel?: string;
  submitLabel?: string;
  submittingLabel?: string;
  helperText?: ReactNode;
  cancelDisabled?: boolean;
  submitDisabled?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function FormActions({
  cancelLabel = 'Cancel',
  submitLabel = 'Save',
  submittingLabel,
  helperText,
  cancelDisabled = false,
  submitDisabled = false,
  loading = false,
  onCancel,
  onSubmit,
}: FormActionsProps) {
  const resolvedSubmitLabel = loading ? (submittingLabel ?? submitLabel) : submitLabel;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      sx={{ width: '100%' }}
    >
      {helperText ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620 }}>
          {helperText}
        </Typography>
      ) : <span />}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="flex-end"
        sx={{ width: { xs: '100%', sm: 'auto' }, '& > *': { width: { xs: '100%', sm: 'auto' } } }}
      >
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={cancelDisabled || loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitDisabled || loading}
          startIcon={loading ? <CircularProgress color="inherit" size={16} /> : undefined}
        >
          {resolvedSubmitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
