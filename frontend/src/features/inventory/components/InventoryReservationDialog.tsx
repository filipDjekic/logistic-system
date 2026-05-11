import { useEffect } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { InventoryListRow } from '../types/inventory.types';

type ReservationMode = 'reserve' | 'release';

type FormValues = {
  quantity: number | '';
  note: string;
};

type Props = {
  open: boolean;
  mode: ReservationMode;
  row: InventoryListRow | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: { quantity: number; note?: string }) => void;
};

const defaultValues: FormValues = {
  quantity: '',
  note: '',
};

export default function InventoryReservationDialog({
  open,
  mode,
  row,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const { control, formState, handleSubmit, reset } = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const maxQuantity = mode === 'reserve'
    ? row?.availableQuantity ?? 0
    : row?.reservedQuantity ?? 0;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'reserve' ? 'Reserve stock' : 'Release reservation'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {row ? (
            <Alert severity="info">
              {row.productName} in {row.warehouseName}. Available: {row.availableQuantity}. Reserved: {row.reservedQuantity}.
            </Alert>
          ) : null}

          <Typography variant="body2" color="text.secondary">
            {mode === 'reserve'
              ? 'Reservation lowers available stock without physically moving goods.'
              : 'Release returns reserved stock back to available stock without changing physical quantity.'}
          </Typography>

          <Controller
            name="quantity"
            control={control}
            rules={{
              required: 'Quantity is required',
              min: { value: 0.01, message: 'Quantity must be greater than 0' },
              max: { value: maxQuantity, message: `Quantity cannot exceed ${maxQuantity}` },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Quantity"
                type="number"
                fullWidth
                inputProps={{ min: 0.01, max: maxQuantity, step: 0.01 }}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? `Maximum: ${maxQuantity}`}
                onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
              />
            )}
          />

          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Note" multiline minRows={3} fullWidth />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={loading || !formState.isValid || !row || maxQuantity <= 0}
          onClick={handleSubmit((values) => {
            if (values.quantity === '') {
              return;
            }
            onSubmit({ quantity: Number(values.quantity), note: values.note?.trim() || undefined });
          })}
        >
          {mode === 'reserve' ? 'Reserve' : 'Release'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
