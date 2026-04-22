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
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { CompanyResponse } from '../../companies/types/company.types';
import type {
  ProductFormValues,
  ProductResponse,
} from '../types/product.types';

type Props = {
  open: boolean;
  initialData?: ProductResponse | null;
  companies: CompanyResponse[];
  showCompanySelect: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => void;
};

const unitOptions = [
  { value: 'PIECE', label: 'Piece' },
  { value: 'KG', label: 'Kilogram' },
  { value: 'LITER', label: 'Liter' },
  { value: 'PALLET', label: 'Pallet' },
  { value: 'BOX', label: 'Box' },
] as const;

const defaultValues: ProductFormValues = {
  name: '',
  description: '',
  sku: '',
  unit: 'PIECE',
  price: '',
  fragile: false,
  weight: '',
  companyId: '',
};

export default function ProductFormDialog({
  open,
  initialData,
  companies,
  showCompanySelect,
  onClose,
  onSubmit,
}: Props) {
  const { control, handleSubmit, reset } = useForm<ProductFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description ?? '',
        sku: initialData.sku,
        unit: initialData.unit,
        price: String(initialData.price),
        fragile: initialData.fragile,
        weight: String(initialData.weight),
        companyId: initialData.companyId != null ? String(initialData.companyId) : '',
      });
      return;
    }

    reset(defaultValues);
  }, [initialData, open, reset]);

  const companyOptions = companies.map((company) => ({
    value: String(company.id),
    label: company.name,
  }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? 'Edit' : 'Create'} Product</DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="name" control={control} label="Name" required />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="sku" control={control} label="SKU" required />
          </Grid>

          {showCompanySelect && !initialData ? (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="companyId"
                control={control}
                label="Company"
                options={companyOptions}
                required
              />
            </Grid>
          ) : null}

          <Grid size={{ xs: 12 }}>
            <Form name="description" control={control} label="Description" />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormSelect
              name="unit"
              control={control}
              label="Unit"
              options={unitOptions}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="price" control={control} label="Price" type="number" />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Form name="weight" control={control} label="Weight" type="number" />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormCheckbox name="fragile" control={control} label="Fragile" />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}