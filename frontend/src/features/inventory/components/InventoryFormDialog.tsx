import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Form from '../../../shared/components/Form/Form';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type {
  InventoryFormValues,
  InventoryProductOption,
  InventoryWarehouseOption,
  InventoryListRow,
} from '../types/inventory.types';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: InventoryListRow | null;
  warehouses: InventoryWarehouseOption[];
  products: InventoryProductOption[];
  loading?: boolean;
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
  onClose,
  onSubmit,
}: Props) {
  const { control, formState, handleSubmit, reset } = useForm<InventoryFormValues>({
    defaultValues,
    mode: 'onChange',
  });

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

  const disableSubmit = loading || !formState.isValid;

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
              <FormSelect
                name="warehouseId"
                control={control}
                label="Warehouse"
                required
                disabled={mode === 'edit'}
                rules={{ required: 'Warehouse is required' }}
                helperText={mode === 'edit' ? 'Warehouse cannot be changed after record creation.' : undefined}
                options={warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: `${warehouse.name} (${warehouse.city})`,
                }))}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="productId"
                control={control}
                label="Product"
                required
                disabled={mode === 'edit'}
                rules={{ required: 'Product is required' }}
                helperText={mode === 'edit' ? 'Product cannot be changed after record creation.' : undefined}
                options={products.map((product) => ({
                  value: product.id,
                  label: `${product.name} (${product.sku})`,
                }))}
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
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={disableSubmit}>
          {mode === 'create' ? 'Create record' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
