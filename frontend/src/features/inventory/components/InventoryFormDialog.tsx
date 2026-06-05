import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import FormActions from '../../../shared/components/Form/FormActions';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import Form from '../../../shared/components/Form/Form';
import BusinessRuleWarnings, { type BusinessRuleWarning } from '../../../shared/components/BusinessRuleWarnings';
import { EntityLookupField } from '../../lookup';
import type {
  InventoryFormValues,
  InventoryProductOption,
  InventoryWarehouseOption,
  InventoryListRow,
} from '../types/inventory.types';
import { inventoryFormSchema } from '../validation/inventorySchema';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: InventoryListRow | null;
  warehouses: InventoryWarehouseOption[];
  products: InventoryProductOption[];
  loading?: boolean;
  serverError?: unknown;
  onClose: () => void;
  onSubmit: (values: InventoryFormValues) => void;
};

const defaultValues: InventoryFormValues = {
  warehouseId: '',
  productId: '',
  quantity: '',
  minStockLevel: '',
};

export default function InventoryFormDialog({
  open,
  mode,
  initialData,
  warehouses,
  products,
  loading = false,
  serverError = null,
  onClose,
  onSubmit,
}: Props) {
  const { control, formState, handleSubmit, reset, setError } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open || !serverError) {
      return;
    }

    applyServerFieldErrors(serverError, setError);
  }, [open, serverError, setError]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      reset({
        warehouseId: initialData.warehouseId,
        productId: initialData.productId,
        quantity: initialData.quantity,
        minStockLevel: initialData.minStockLevel ?? '',
      });
      return;
    }

    reset(defaultValues);
  }, [initialData, mode, open, reset]);

  const warehouseId = useWatch({ control, name: 'warehouseId' });
  const productId = useWatch({ control, name: 'productId' });
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === Number(warehouseId));
  const selectedProduct = products.find((product) => product.id === Number(productId));

  const quantity = Number(useWatch({ control, name: 'quantity' }));
  const minStockLevel = Number(useWatch({ control, name: 'minStockLevel' }));
  const businessWarnings: BusinessRuleWarning[] = [];

  if (selectedWarehouse && selectedWarehouse.status !== 'ACTIVE') {
    businessWarnings.push({
      key: 'warehouse-status',
      severity: selectedWarehouse.status === 'FULL' ? 'warning' : 'error',
      message: `Selected warehouse is ${selectedWarehouse.status}. Inventory records should normally be created or edited only for active warehouses.`,
    });
  }

  if (selectedWarehouse && Number.isFinite(quantity) && quantity > Number(selectedWarehouse.capacity)) {
    businessWarnings.push({
      key: 'quantity-capacity',
      severity: 'error',
      message: `Quantity exceeds warehouse capacity (${selectedWarehouse.capacity}).`,
    });
  }

  if (Number.isFinite(quantity) && Number.isFinite(minStockLevel) && quantity < minStockLevel) {
    businessWarnings.push({
      key: 'low-stock-at-create',
      severity: 'warning',
      message: 'Current quantity is below the configured minimum stock level. This record will immediately be treated as low stock.',
    });
  }

  const blockingWarning = businessWarnings.some((warning) => warning.severity === 'error');
  const disableSubmit = loading || !formState.isValid || blockingWarning;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create' ? 'Create inventory record' : 'Edit inventory record'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select warehouse and product, then set current quantity and minimum stock level.
          </Typography>

          <Typography variant="subtitle2" fontWeight={700}>
            Inventory location
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="warehouseId"
                control={control}
                rules={{ required: 'Warehouse is required' }}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Warehouse"
                    entityType="warehouses"
                    required
                    disabled={mode === 'edit'}
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedWarehouse?.name ?? `Warehouse #${field.value}`,
                      subtitle: selectedWarehouse?.city ?? undefined,
                      status: selectedWarehouse?.status ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? '')}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? (mode === 'edit' ? 'Warehouse cannot be changed after record creation.' : undefined)}
                    searchPlaceholder="Search warehouses..."
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="productId"
                control={control}
                rules={{ required: 'Product is required' }}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Product"
                    entityType="products"
                    required
                    disabled={mode === 'edit'}
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedProduct?.name ?? `Product #${field.value}`,
                      subtitle: selectedProduct?.sku ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? '')}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? (mode === 'edit' ? 'Product cannot be changed after record creation.' : undefined)}
                    searchPlaceholder="Search products..."
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Stock levels
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Form
                name="quantity"
                control={control}
                label="Quantity"
                type="number"
                required
                rules={{
                  required: 'Quantity is required',
                  min: { value: 0, message: 'Quantity cannot be negative' },
                }}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Form
                name="minStockLevel"
                control={control}
                label="Minimum stock level"
                type="number"
                required
                rules={{
                  required: 'Minimum stock level is required',
                  min: { value: 0, message: 'Minimum stock level cannot be negative' },
                }}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Grid>
          </Grid>

          <BusinessRuleWarnings warnings={businessWarnings} />
        </Stack>
      </DialogContent>

      <DialogContent sx={{ pt: 2 }}>
        <FormActions
          submitLabel={mode === 'create' ? 'Create record' : 'Save changes'}
          submittingLabel={mode === 'create' ? 'Creating record...' : 'Saving changes...'}
          helperText="Warehouse, product and stock levels must be valid before saving."
          loading={loading}
          submitDisabled={disableSubmit}
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
        />
      </DialogContent>
    </Dialog>
  );
}
