import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import {
  Alert,
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import FormActions from '../../../shared/components/Form/FormActions';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import { useInventoryRecord } from '../hooks/useInventoryRecord';
import {
  useCreateInventoryRecord,
  useUpdateInventoryRecord,
} from '../hooks/useInventoryMutations';

type Props = {
  mode: 'create' | 'edit';
};

function normalizeNumber(value: string) {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function InventoryFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuthStore();
  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const routeWarehouseId = useMemo(() => Number(params.warehouseId), [params.warehouseId]);
  const routeProductId = useMemo(() => Number(params.productId), [params.productId]);
  const isEdit = mode === 'edit';
  const isValidEditRoute =
    !isEdit ||
    (Number.isInteger(routeWarehouseId) &&
      routeWarehouseId > 0 &&
      Number.isInteger(routeProductId) &&
      routeProductId > 0);

  const inventoryRecordQuery = useInventoryRecord(
    isEdit && isValidEditRoute ? routeWarehouseId : null,
    isEdit && isValidEditRoute ? routeProductId : null,
  );

  const createInventoryMutation = useCreateInventoryRecord();
  const updateInventoryMutation = useUpdateInventoryRecord();

  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LookupOption | null>(null);
  const [quantity, setQuantity] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isEdit || !inventoryRecordQuery.data) return;

    const { record, warehouse, product } = inventoryRecordQuery.data;
    setSelectedWarehouse(
      warehouse
        ? {
            id: warehouse.id,
            label: warehouse.name,
            subtitle: warehouse.city ?? record.warehouseName ?? undefined,
            status: warehouse.status,
          }
        : null,
    );
    setSelectedProduct(
      product
        ? {
            id: product.id,
            label: product.name,
            subtitle: product.sku ?? product.description ?? undefined,
            status: 'ACTIVE',
          }
        : null,
    );
    setQuantity(String(record.quantity));
    setMinStockLevel(String(record.minStockLevel));
  }, [inventoryRecordQuery.data, isEdit]);

  if (!canManage) {
    return (
      <ErrorState
        title="Access denied"
        description="Inventory records can be created and edited only by overlord or warehouse manager roles."
      />
    );
  }

  if (!isValidEditRoute) {
    return (
      <ErrorState
        title="Invalid inventory edit route"
        description="Warehouse ID and product ID must both be positive integers."
      />
    );
  }

  if (isEdit && inventoryRecordQuery.isLoading) {
    return <InlineLoader message="Loading inventory record..." />;
  }

  if (isEdit && (inventoryRecordQuery.isError || !inventoryRecordQuery.data)) {
    return (
      <ErrorState
        title="Inventory record could not be loaded"
        description="The requested inventory record was not found or could not be loaded."
        onRetry={() => {
          void inventoryRecordQuery.refetch();
        }}
      />
    );
  }

  const normalizedQuantity = normalizeNumber(quantity);
  const normalizedMinStockLevel = normalizeNumber(minStockLevel);
  const hasWarehouse = selectedWarehouse !== null || isEdit;
  const hasProduct = selectedProduct !== null || isEdit;
  const hasInvalidQuantity = submitted && (normalizedQuantity === null || normalizedQuantity < 0);
  const hasInvalidMinStockLevel = submitted && (normalizedMinStockLevel === null || normalizedMinStockLevel < 0);
  const isSubmitting = createInventoryMutation.isPending || updateInventoryMutation.isPending;
  const submitError = createInventoryMutation.error ?? updateInventoryMutation.error;
  const disableSubmit =
    isSubmitting ||
    !hasWarehouse ||
    !hasProduct ||
    normalizedQuantity === null ||
    normalizedQuantity < 0 ||
    normalizedMinStockLevel === null ||
    normalizedMinStockLevel < 0;

  const handleSubmit = () => {
    setSubmitted(true);

    if (disableSubmit || normalizedQuantity === null || normalizedMinStockLevel === null) {
      return;
    }

    if (mode === 'create') {
      if (!selectedWarehouse || !selectedProduct) return;

      createInventoryMutation.mutate(
        {
          warehouseId: selectedWarehouse.id,
          productId: selectedProduct.id,
          quantity: normalizedQuantity,
          minStockLevel: normalizedMinStockLevel,
        },
        {
          onSuccess: (record) => {
            navigate(`/inventory/${record.warehouseId}/${record.productId}`);
          },
        },
      );
      return;
    }

    updateInventoryMutation.mutate(
      {
        warehouseId: routeWarehouseId,
        productId: routeProductId,
        data: {
          warehouseId: routeWarehouseId,
          productId: routeProductId,
          quantity: normalizedQuantity,
          minStockLevel: normalizedMinStockLevel,
        },
      },
      {
        onSuccess: (record) => {
          navigate(`/inventory/${record.warehouseId}/${record.productId}`);
        },
      },
    );
  };

  const title = mode === 'create' ? 'Create inventory record' : 'Edit inventory record';
  const description =
    mode === 'create'
      ? 'Search and select warehouse and product before entering stock levels.'
      : 'Warehouse and product are immutable because inventory uses a composite warehouse/product identity.';

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Inventory"
        title={title}
        description={description}
        actions={
          <Button variant="outlined" onClick={() => navigate('/inventory')} disabled={isSubmitting}>
            Back to list
          </Button>
        }
      />

      <SectionCard title="Inventory identity" description="Pick the related records from searchable result tables.">
        <Stack spacing={2.5}>
          {mode === 'edit' ? (
            <Alert severity="info">
              Existing inventory identity cannot be changed. Create a new record if warehouse or product is wrong.
            </Alert>
          ) : null}

          {mode === 'create' ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <EntityLookupField
                  label="Warehouse"
                  entityType="warehouses"
                  value={selectedWarehouse}
                  onChange={setSelectedWarehouse}
                  required
                  error={submitted && !selectedWarehouse}
                  helperText={submitted && !selectedWarehouse ? 'Warehouse is required.' : undefined}
                  searchPlaceholder="Search warehouses..."
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <EntityLookupField
                  label="Product"
                  entityType="products"
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  required
                  error={submitted && !selectedProduct}
                  helperText={submitted && !selectedProduct ? 'Product is required.' : undefined}
                  searchPlaceholder="Search products..."
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Warehouse"
                  value={inventoryRecordQuery.data?.record.warehouseName ?? routeWarehouseId}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Product"
                  value={inventoryRecordQuery.data?.record.productName ?? routeProductId}
                  fullWidth
                  disabled
                />
              </Grid>
            </Grid>
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Stock levels">
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Quantity and minimum stock level must be zero or greater.
          </Typography>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
                fullWidth
                error={hasInvalidQuantity}
                helperText={hasInvalidQuantity ? 'Quantity must be zero or greater.' : undefined}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Minimum stock level"
                type="number"
                value={minStockLevel}
                onChange={(event) => setMinStockLevel(event.target.value)}
                required
                fullWidth
                error={hasInvalidMinStockLevel}
                helperText={hasInvalidMinStockLevel ? 'Minimum stock level must be zero or greater.' : undefined}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Grid>
          </Grid>

          <FormGlobalError error={submitError} fallbackMessage="Inventory record could not be saved." />

          <FormActions
            cancelLabel="Cancel"
            submitLabel={mode === 'create' ? 'Create record' : 'Save changes'}
            submittingLabel={mode === 'create' ? 'Creating record...' : 'Saving changes...'}
            helperText="Warehouse, product and stock levels must be valid before saving."
            loading={isSubmitting}
            submitDisabled={disableSubmit}
            onCancel={() => navigate('/inventory')}
            onSubmit={handleSubmit}
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
