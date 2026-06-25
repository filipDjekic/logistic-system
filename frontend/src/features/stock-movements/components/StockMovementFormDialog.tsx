import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import FormActions from '../../../shared/components/Form/FormActions';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import { EntityLookupField } from '../../lookup';
import type {
  StockMovementProductOption,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';
import {
  stockMovementDiscrepancyReasonOptions,
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
  serverError?: unknown;
  onClose: () => void;
  onSubmit: (values: StockMovementSchemaValues) => void;
};

const defaultValues: StockMovementSchemaValues = {
  movementType: 'INBOUND',
  quantity: 0,
  expectedQuantity: null,
  actualQuantity: null,
  discrepancyReason: null,
  discrepancyNote: '',
  unitCost: null,
  totalCost: null,
  currency: '',
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
  serverError = null,
  onClose,
  onSubmit,
}: StockMovementFormDialogProps) {
  const form = useForm<StockMovementSchemaValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues,
    mode: 'onChange',
  });

  const movementType = useWatch({
    control: form.control,
    name: 'movementType',
  });

  const isTransferMovement =
    movementType === 'TRANSFER_IN' || movementType === 'TRANSFER_OUT';


  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === form.watch('warehouseId'));
  const selectedProduct = products.find((product) => product.id === form.watch('productId'));
  const selectedTransportOrder = transportOrders.find((order) => order.id === form.watch('transportOrderId'));

  useEffect(() => {
    if (!open || !serverError) {
      return;
    }

    applyServerFieldErrors(serverError, form.setError);
  }, [form, open, serverError]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(defaultValues);
  }, [form, open]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Submit stock movement</DialogTitle>

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
                name="expectedQuantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Expected quantity"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? 'Optional. Empty value uses quantity.'}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="actualQuantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Actual quantity"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? 'Optional. Empty value uses quantity.'}
                  />
                )}
              />
            </Grid>


            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="unitCost"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Unit cost"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? 'Optional movement valuation.'}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="totalCost"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Total cost"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? 'Optional. Backend can use it for valuation.'}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="currency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Currency"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? 'ISO code, e.g. RSD, EUR, USD.'}
                    inputProps={{ maxLength: 3 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="discrepancyReason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    select
                    fullWidth
                    label="Discrepancy reason"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    onChange={(event) => field.onChange(event.target.value || null)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {stockMovementDiscrepancyReasonOptions.map((option) => (
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
                name="discrepancyNote"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Discrepancy note"
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
                  <EntityLookupField
                    label="Warehouse"
                    entityType="warehouses"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedWarehouse?.name ?? `Warehouse #${field.value}`,
                      subtitle: selectedWarehouse?.city ?? undefined,
                      status: selectedWarehouse?.status ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search warehouses..."
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                name="productId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Product"
                    entityType="products"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedProduct?.name ?? `Product #${field.value}`,
                      subtitle: selectedProduct?.sku ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search products..."
                  />
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
                    <EntityLookupField
                      label="Transport order"
                      entityType="transport-orders"
                      required
                      value={field.value ? {
                        id: Number(field.value),
                        label: selectedTransportOrder?.orderNumber ?? `Transport order #${field.value}`,
                        status: selectedTransportOrder?.status ?? undefined,
                      } : null}
                      onChange={(option) => field.onChange(option?.id ?? null)}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                      searchPlaceholder="Search transport orders..."
                    />
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

      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel="Submit"
          submittingLabel="Submitting movement..."
          helperText="Product, warehouse and quantity rules must be valid before submitting the movement into lifecycle."
          loading={loading}
          submitDisabled={!form.formState.isValid}
          onCancel={onClose}
          onSubmit={form.handleSubmit((values) => onSubmit({
            ...values,
            reasonDescription: values.reasonDescription?.trim() || undefined,
            referenceNumber: values.referenceNumber?.trim() || undefined,
            referenceNote: values.referenceNote?.trim() || undefined,
            discrepancyNote: values.discrepancyNote?.trim() || undefined,
            currency: values.currency?.trim().toUpperCase() || undefined,
          }))}
        />
      </DialogContent>
    </Dialog>
  );
}