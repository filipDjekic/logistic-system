import { useEffect, useMemo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type {
  StockMovementProductOption,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';
import {
  stockMovementReasonCodeOptions,
  stockMovementReferenceTypeOptions,
  stockMovementSchema,
  stockMovementTypeOptions,
  type StockMovementSchemaValues,
} from '../validation/stockMovementSchema';

type StockMovementFormDialogProps = {
  open: boolean;
  warehouses: StockMovementWarehouseOption[];
  products: StockMovementProductOption[];
  transportOrders: StockMovementTransportOrderOption[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: StockMovementSchemaValues) => void;
};

const defaultValues: StockMovementSchemaValues = {
  movementType: 'INBOUND',
  quantity: 0,
  reasonCode: 'MANUAL_INBOUND',
  reasonDescription: '',
  referenceType: 'MANUAL',
  referenceId: null,
  referenceNumber: '',
  referenceNote: '',
  transportOrderId: null,
  warehouseId: 0,
  productId: 0,
};

export default function StockMovementFormDialog({
  open,
  warehouses,
  products,
  transportOrders,
  loading = false,
  onClose,
  onSubmit,
}: StockMovementFormDialogProps) {
  const form = useForm<StockMovementSchemaValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues,
  });

  const movementType = useWatch({
    control: form.control,
    name: 'movementType',
  });

  const isTransferMovement =
    movementType === 'TRANSFER_IN' || movementType === 'TRANSFER_OUT';

  const transportOrderOptions = useMemo(
    () =>
      transportOrders.map((order) => ({
        value: order.id,
        label: `${order.orderNumber} (#${order.id})`,
      })),
    [transportOrders],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(defaultValues);
  }, [form, open]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Create stock movement</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="movementType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Movement type"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  >
                    {stockMovementTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                name="quantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                name="warehouseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    fullWidth
                    label="Warehouse"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                name="productId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    fullWidth
                    label="Product"
                    value={field.value ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="reasonCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Reason code"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  >
                    {stockMovementReasonCodeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="referenceType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Reference type"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  >
                    {stockMovementReferenceTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {isTransferMovement ? (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="transportOrderId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      select
                      fullWidth
                      label="Transport order"
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                        )
                      }
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    >
                      {transportOrderOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            ) : null}

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="referenceId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Reference ID"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="referenceNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Reference number"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="reasonDescription"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Reason description"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="referenceNote"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Reference note"
                    multiline
                    minRows={3}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={form.handleSubmit((values) => onSubmit(values))}
          disabled={loading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}