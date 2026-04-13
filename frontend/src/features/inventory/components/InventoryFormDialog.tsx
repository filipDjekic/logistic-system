import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
  const { control, handleSubmit, reset } = useForm<InventoryFormValues>({
    defaultValues,
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

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create' ? 'Create inventory record' : 'Edit inventory record'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormSelect
              name="warehouseId"
              control={control}
              label="Warehouse"
              required
              disabled={mode === 'edit'}
              options={warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
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
              options={products.map((product) => ({
                value: product.id,
                label: `${product.name} (${product.sku})`,
              }))}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form
              name="quantity"
              control={control}
              label="Quantity"
              type="number"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form
              name="minStockLevel"
              control={control}
              label="Minimum stock level"
              type="number"
              required
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={loading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}