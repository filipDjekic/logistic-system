import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
} from '@mui/material';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import Form from '../../../shared/components/Form/Form';
import FormCheckbox from '../../../shared/components/Form/FormCheckbox';
import FormActions from '../../../shared/components/Form/FormActions';
import FormSection from '../../../shared/components/Form/FormSection';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { CompanyResponse } from '../../companies/types/company.types';
import type {
  ProductFormValues,
  ProductResponse,
} from '../types/product.types';
import { productSchema } from '../validation/productSchema';

type Props = {
  open: boolean;
  initialData?: ProductResponse | null;
  companies: CompanyResponse[];
  showCompanySelect: boolean;
  loading?: boolean;
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
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const { control, handleSubmit, reset, formState } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
    mode: 'onChange',
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

  const selectedCompanyId = useWatch({ control, name: 'companyId' });
  const companyOptions = companies.map((company) => ({
    value: String(company.id),
    label: company.name,
  }));
  const companyRequired = showCompanySelect && !initialData;
  const submitDisabled = !formState.isValid || (companyRequired && !selectedCompanyId);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? 'Edit' : 'Create'} Product</DialogTitle>

      <DialogContent>
        <FormSection title="Product details" description="Keep master data clear. Dynamic relations use lookup elsewhere; enum values stay as dropdowns.">
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
        </FormSection>
      </DialogContent>

      <DialogContent sx={{ pt: 0 }}>
        <FormActions
          cancelLabel="Cancel"
          submitLabel="Save product"
          submittingLabel="Saving product..."
          helperText="Review product name, SKU, unit and physical properties before saving."
          loading={loading}
          submitDisabled={submitDisabled}
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
        />
      </DialogContent>
    </Dialog>
  );
}