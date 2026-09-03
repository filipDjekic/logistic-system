import { useMemo, useState } from 'react';
import { Button, CardActionArea, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import BusinessRuleWarnings, { type BusinessRuleWarning } from '../../../shared/components/BusinessRuleWarnings';
import FormActions from '../../../shared/components/Form/FormActions';
import FormProgress from '../../../shared/components/Form/FormProgress';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { EntityLookupField, type LookupOption } from '../../lookup';
import type { StockOperationType } from '../types/stockMovement.types';
import { useCreateStockOperation } from '../hooks/useStockMovements';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { calculateStockMovementCost } from '../utils/stockMovementCost';
import { stockMovementsApi } from '../api/stockMovementsApi';

type StockOperationFormValues = {
  quantity: number | '';
  warehouse: LookupOption | null;
  destinationWarehouse: LookupOption | null;
  product: LookupOption | null;
  transportOrder: LookupOption | null;
  stockMovementReference: LookupOption | null;
  adjustmentDirection: 'INCREASE' | 'DECREASE';
  reasonDescription: string;
  referenceNumber: string;
  referenceNote: string;
};

type FieldErrors = Partial<Record<keyof StockOperationFormValues, string>>;

type OperationConfig = {
  title: string;
  description: string;
  submitLabel: string;
};

const operationConfig: Record<StockOperationType, OperationConfig> = {
  inbound: {
    title: 'Receive stock',
    description: 'Creates an inbound stock movement.',
    submitLabel: 'Submit inbound movement',
  },
  outbound: {
    title: 'Issue stock',
    description: 'Creates an outbound stock movement.',
    submitLabel: 'Submit outbound movement',
  },
  transfer: {
    title: 'Transfer stock',
    description: 'Moves product quantity from source warehouse to destination warehouse. Transport order can be selected when transfer follows transport flow.',
    submitLabel: 'Submit transfer movements',
  },
  adjustment: {
    title: 'Adjust stock',
    description: 'Creates an adjustment request. Large adjustments can be routed to approval before execution.',
    submitLabel: 'Submit adjustment movement',
  },
  'write-off': {
    title: 'Write off stock',
    description: 'Creates a write-off request. Write-offs are routed through approval before inventory is affected.',
    submitLabel: 'Submit write-off movement',
  },
  return: {
    title: 'Return stock',
    description: 'Creates a return movement. Related movement context can be selected when the return follows existing stock activity.',
    submitLabel: 'Submit return movement',
  },
};

const operationOrder: StockOperationType[] = ['inbound', 'outbound', 'adjustment', 'write-off', 'return'];
const stockOperationSteps = ['Operation', 'Entities', 'Quantity', 'Reference', 'Submit'];

const initialValues: StockOperationFormValues = {
  quantity: '',
  warehouse: null,
  destinationWarehouse: null,
  product: null,
  transportOrder: null,
  stockMovementReference: null,
  adjustmentDirection: 'INCREASE',
  reasonDescription: '',
  referenceNumber: '',
  referenceNote: '',
};

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function referenceNumberFromTransportOrder(transportOrder: LookupOption | null) {
  return transportOrder?.label?.trim() || undefined;
}

function referenceNumberFromStockMovement(stockMovement: LookupOption | null) {
  if (!stockMovement) {
    return undefined;
  }

  return stockMovement.label?.trim() || `STOCK_MOVEMENT_${stockMovement.id}`;
}

function returnRequiresAvailableStock(reference: LookupOption | null) {
  if (!reference) return false;
  const movementType = reference.label.split(/\s|#/)[0]?.toUpperCase();
  return movementType === 'INBOUND' || movementType === 'TRANSFER_IN' || movementType === 'RETURN_IN';
}

const generatedReferenceNumber = (operation: StockOperationType) => {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const prefix = operation.toUpperCase().replace(/-/g, '_');

  return `${prefix}_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function resolvedReferenceNumber(
  operation: StockOperationType,
  typedReferenceNumber: string,
  transportOrder: LookupOption | null,
  stockMovementReference: LookupOption | null,
) {
  return (
    optionalText(typedReferenceNumber) ??
    referenceNumberFromTransportOrder(transportOrder) ??
    referenceNumberFromStockMovement(stockMovementReference) ??
    generatedReferenceNumber(operation)
  );
}

export default function StockOperationPage() {
  const navigate = useNavigate();
  const mutation = useCreateStockOperation();
  const [operation, setOperation] = useState<StockOperationType | null>(null);
  const [values, setValues] = useState<StockOperationFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  const config = operation ? operationConfig[operation] : null;
  const isTransfer = operation === 'transfer';
  const isAdjustment = operation === 'adjustment';
  const requiresExistingStock = operation === 'outbound'
    || operation === 'transfer'
    || operation === 'write-off'
    || (operation === 'adjustment' && values.adjustmentDirection === 'DECREASE')
    || (operation === 'return' && returnRequiresAvailableStock(values.stockMovementReference));
  const usesTransportOrder = operation === 'transfer';
  const allowsStockMovementReference = operation === 'outbound' || operation === 'write-off' || operation === 'return';
  const submitDisabled = mutation.isPending;
  const quantityValue = Number(values.quantity);
  const contextQuery = useQuery({
    queryKey: ['stock-movement-context', values.warehouse?.id, values.product?.id],
    queryFn: () => stockMovementsApi.context(values.warehouse!.id, values.product!.id),
    enabled: Boolean(values.warehouse && values.product),
  });
  const movementContext = contextQuery.data;
  const calculatedCost = movementContext
    ? calculateStockMovementCost(quantityValue, Number(movementContext.unitCost))
    : null;

  const businessWarnings: BusinessRuleWarning[] = [];

  const hasBlockingBusinessWarning = businessWarnings.some((warning) => warning.severity === 'error');

  const activeStep = useMemo(() => {
    if (!operation) return 0;
    if (!values.warehouse || !values.product || (isTransfer && !values.destinationWarehouse)) return 1;
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) return 2;
    if (values.transportOrder || values.stockMovementReference || values.referenceNumber.trim()) return 4;
    return 3;
  }, [isTransfer, operation, quantityValue, values.destinationWarehouse, values.product, values.referenceNumber, values.stockMovementReference, values.transportOrder, values.warehouse]);

  const pageDescription = useMemo(() => {
    if (!operation || !config) {
      return 'Choose the stock operation first.';
    }

    return config.description;
  }, [config, operation]);

  function resetFormForOperation(nextOperation: StockOperationType) {
    setOperation(nextOperation);
    setValues(initialValues);
    setErrors({});
  }

  function validate() {
    const nextErrors: FieldErrors = {};
    const quantity = Number(values.quantity);

    if (!operation) {
      setErrors(nextErrors);
      return false;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!movementContext) {
      nextErrors.product = contextQuery.isError ? getErrorMessage(contextQuery.error) : 'Wait for inventory availability and cost data';
    }

    if (requiresExistingStock && movementContext && quantity > Number(movementContext.availableQuantity)) {
      nextErrors.quantity = `Quantity cannot exceed available quantity (${movementContext.availableQuantity})`;
    }

    if (!values.warehouse) {
      nextErrors.warehouse = isTransfer ? 'Source warehouse is required' : 'Warehouse is required';
    }

    if (isTransfer && !values.destinationWarehouse) {
      nextErrors.destinationWarehouse = 'Destination warehouse is required';
    }

    if (
      isTransfer &&
      values.warehouse &&
      values.destinationWarehouse &&
      values.warehouse.id === values.destinationWarehouse.id
    ) {
      nextErrors.destinationWarehouse = 'Destination warehouse must be different from source warehouse';
    }

    if (!values.product) {
      nextErrors.product = 'Product is required';
    }

    if (hasBlockingBusinessWarning) {
      nextErrors.referenceNote = nextErrors.referenceNote ?? 'Resolve blocking business warnings before submit';
    }

    if (values.referenceNumber.trim().length > 100) {
      nextErrors.referenceNumber = 'Reference number must be at most 100 characters';
    }

    if (values.reasonDescription.trim().length > 255) {
      nextErrors.reasonDescription = 'Reason description must be at most 255 characters';
    }

    if (values.referenceNote.trim().length > 255) {
      nextErrors.referenceNote = 'Reference note must be at most 255 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    if (!operation || !validate() || !values.warehouse || !values.product || !calculatedCost) {
      return;
    }

    const common = {
      quantity: Number(values.quantity),
      reasonDescription: optionalText(values.reasonDescription),
      referenceNumber: resolvedReferenceNumber(operation, values.referenceNumber, values.transportOrder, values.stockMovementReference),
      referenceNote: optionalText(values.referenceNote),
    };

    const selectedReferenceId = values.transportOrder?.id ?? values.stockMovementReference?.id;

    const afterSuccess = (created: unknown) => {
      const firstMovement = Array.isArray(created) ? created[0] : created;
      const createdId = typeof firstMovement === 'object' && firstMovement !== null && 'id' in firstMovement
        ? Number((firstMovement as { id: unknown }).id)
        : null;

      if (createdId && Number.isFinite(createdId)) {
        navigate(`/stock-movements/${createdId}`);
        return;
      }

      navigate('/stock-movements');
    };


    if (operation === 'transfer') {
      if (!values.destinationWarehouse) return;

      mutation.mutate(
        {
          type: 'transfer',
          payload: {
            ...common,
            transportOrderId: values.transportOrder?.id,
            sourceWarehouseId: values.warehouse.id,
            destinationWarehouseId: values.destinationWarehouse.id,
            productId: values.product.id,
          },
        },
        { onSuccess: afterSuccess },
      );
      return;
    }

    if (operation === 'adjustment') {
      mutation.mutate(
        {
          type: 'adjustment',
          payload: {
            ...common,
            direction: values.adjustmentDirection,
            warehouseId: values.warehouse.id,
            productId: values.product.id,
          },
        },
        { onSuccess: afterSuccess },
      );
      return;
    }

    if (operation === 'write-off') {
      mutation.mutate(
        {
          type: 'write-off',
          payload: {
            ...common,
            referenceId: selectedReferenceId,
            warehouseId: values.warehouse.id,
            productId: values.product.id,
          },
        },
        { onSuccess: afterSuccess },
      );
      return;
    }

    if (operation === 'return') {
      mutation.mutate(
        {
          type: 'return',
          payload: {
            ...common,
            referenceId: selectedReferenceId,
            warehouseId: values.warehouse.id,
            productId: values.product.id,
          },
        },
        { onSuccess: afterSuccess },
      );
      return;
    }

    mutation.mutate(
      {
        type: operation,
        payload: {
          ...common,
          referenceId: selectedReferenceId,
          transportOrderId: values.transportOrder?.id,
          warehouseId: values.warehouse.id,
          productId: values.product.id,
        },
      },
      { onSuccess: afterSuccess },
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Stock movements"
        title="Create stock movement"
        description={pageDescription}
        actions={
          <Button variant="outlined" onClick={() => navigate('/stock-movements')} disabled={submitDisabled}>
            Back to movements
          </Button>
        }
      />

      <FormProgress steps={stockOperationSteps} activeStep={activeStep} />

      <SectionCard title="1. Choose operation" description="Select the type of stock movement.">
        <Grid container spacing={2}>
          {operationOrder.map((item) => {
            const itemConfig = operationConfig[item];
            const selected = operation === item;

            return (
              <Grid key={item} size={{ xs: 12, md: 6, xl: 4 }}>
                <CardActionArea
                  onClick={() => resetFormForOperation(item)}
                  disabled={submitDisabled}
                  sx={(theme) => ({
                    border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: 2,
                    p: 2,
                    minHeight: 132,
                    bgcolor: selected ? theme.palette.action.selected : 'background.paper',
                  })}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>{itemConfig.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{itemConfig.description}</Typography>
                  </Stack>
                </CardActionArea>
              </Grid>
            );
          })}
        </Grid>
      </SectionCard>

      {operation && config ? (
        <>
        <SectionCard title="2. Warehouses and product" description="Select the product and applicable warehouses.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <EntityLookupField
                label={isTransfer ? 'Source warehouse' : 'Warehouse'}
                entityType="warehouses"
                accessMode="mutate"
                value={values.warehouse}
                required
                disabledOptionIds={values.destinationWarehouse ? [values.destinationWarehouse.id] : []}
                activeOnly
                searchPlaceholder="Search warehouses by name, city or code..."
                onChange={(warehouse) => {
                  setValues((prev) => ({
                    ...prev,
                    warehouse,
                    product: null,
                    transportOrder: isTransfer ? null : prev.transportOrder,
                  }));
                  setErrors((prev) => ({ ...prev, warehouse: undefined, product: undefined, quantity: undefined }));
                }}
              />
              {errors.warehouse ? <Typography variant="caption" color="error">{errors.warehouse}</Typography> : null}
            </Grid>

            {isTransfer ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <EntityLookupField
                  label="Destination warehouse"
                  entityType="warehouses"
                  accessMode="mutate"
                  value={values.destinationWarehouse}
                  required
                  disabledOptionIds={values.warehouse ? [values.warehouse.id] : []}
                  activeOnly
                  searchPlaceholder="Search destination warehouses..."
                  onChange={(destinationWarehouse) => {
                    setValues((prev) => ({ ...prev, destinationWarehouse }));
                    setErrors((prev) => ({ ...prev, destinationWarehouse: undefined }));
                  }}
                />
                {errors.destinationWarehouse ? <Typography variant="caption" color="error">{errors.destinationWarehouse}</Typography> : null}
              </Grid>
            ) : null}

            <Grid size={{ xs: 12, md: 6 }}>
              <EntityLookupField
                label="Product"
                entityType="products"
                value={values.product}
                required
                activeOnly
                warehouseId={values.warehouse?.id}
                lookupParams={{ mode: requiresExistingStock ? 'AVAILABLE_STOCK' : 'REFERENCE' }}
                disabled={!values.warehouse}
                placeholder={!values.warehouse ? 'Choose warehouse first' : 'Not selected'}
                searchPlaceholder="Search products by name or SKU..."
                onChange={(product) => {
                  setValues((prev) => ({ ...prev, product }));
                  setErrors((prev) => ({ ...prev, product: undefined, quantity: undefined }));
                }}
              />
              {errors.product ? <Typography variant="caption" color="error">{errors.product}</Typography> : null}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <BusinessRuleWarnings warnings={businessWarnings} />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard title="3. Quantity and operation details" description="Enter the quantity and operation-specific values.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={values.quantity}
                disabled={submitDisabled}
                error={Boolean(errors.quantity)}
                helperText={errors.quantity}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setValues((prev) => ({ ...prev, quantity: nextValue === '' ? '' : Number(nextValue) }));
                  setErrors((prev) => ({ ...prev, quantity: undefined }));
                }}
              />
            </Grid>

            <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Available quantity"
                    fullWidth
                    value={movementContext?.availableQuantity ?? ''}
                    placeholder={values.warehouse && values.product ? 'Loading inventory data...' : 'Select warehouse and product first'}
                    helperText="Warehouse on-hand quantity minus reserved quantity."
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Unit cost"
                    fullWidth
                    value={movementContext ? Number(movementContext.unitCost).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : ''}
                    placeholder="Select warehouse and product first"
                    helperText="Current warehouse inventory cost snapshot."
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Currency"
                    fullWidth
                    value={movementContext?.currency ?? ''}
                    placeholder="Select warehouse and product first"
                    helperText="Determined by the inventory valuation."
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Calculated movement cost"
                    fullWidth
                    value={calculatedCost && movementContext ? `${calculatedCost.totalCost.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${movementContext.currency}` : ''}
                    placeholder={movementContext ? 'Enter quantity' : 'Select warehouse and product first'}
                    helperText="Estimated total based on quantity and unit cost."
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
            </>

            {isAdjustment ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Adjustment direction"
                  value={values.adjustmentDirection}
                  disabled={submitDisabled}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      adjustmentDirection: event.target.value === 'DECREASE' ? 'DECREASE' : 'INCREASE',
                      product: null,
                    }))
                  }
                >
                  <MenuItem value="INCREASE">Increase</MenuItem>
                  <MenuItem value="DECREASE">Decrease</MenuItem>
                </TextField>
              </Grid>
            ) : null}

          </Grid>
        </SectionCard>

        <SectionCard title="4. Related records" description="Link a transport order or stock movement, or enter a reference number.">
          <Grid container spacing={2}>
            {usesTransportOrder ? (
              <Grid size={{ xs: 12 }}>
                <EntityLookupField
                  label="Transport order reference"
                  entityType="transport-orders"
                  value={values.transportOrder}
                  disabled={submitDisabled || !values.warehouse || !values.destinationWarehouse}
                  lookupParams={{
                    sourceWarehouseId: values.warehouse?.id,
                    destinationWarehouseId: values.destinationWarehouse?.id,
                    excludeStatuses: 'CANCELLED,COMPLETED',
                  }}
                  searchPlaceholder="Search transport orders..."
                  onChange={(transportOrder) => {
                    setValues((prev) => ({
                      ...prev,
                      transportOrder,
                      stockMovementReference: null,
                      referenceNumber: transportOrder ? '' : prev.referenceNumber,
                    }));
                  }}
                />
              </Grid>
            ) : null}

            {allowsStockMovementReference ? (
              <Grid size={{ xs: 12 }}>
                <EntityLookupField
                  label="Related stock movement reference"
                  entityType="stock-movements"
                  value={values.stockMovementReference}
                  searchPlaceholder="Search stock movements..."
                  onChange={(stockMovementReference) => {
                    setValues((prev) => ({
                      ...prev,
                      stockMovementReference,
                      product: operation === 'return' ? null : prev.product,
                      transportOrder: null,
                      referenceNumber: prev.referenceNumber || referenceNumberFromStockMovement(stockMovementReference) || '',
                    }));
                  }}
                />
              </Grid>
            ) : null}

            {!values.transportOrder ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Reference number (optional)"
                  fullWidth
                  value={values.referenceNumber}
                  disabled={submitDisabled}
                  error={Boolean(errors.referenceNumber)}
                  helperText={errors.referenceNumber ?? `Empty value generates ${generatedReferenceNumber(operation)}`}
                  onChange={(event) => {
                    setValues((prev) => ({ ...prev, referenceNumber: event.target.value }));
                    setErrors((prev) => ({ ...prev, referenceNumber: undefined }));
                  }}
                />
              </Grid>
            ) : null}
          </Grid>
        </SectionCard>

        <SectionCard title="5. Review and submit" description="Review the information before creating the stock movement.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Reason description"
                fullWidth
                value={values.reasonDescription}
                disabled={submitDisabled}
                error={Boolean(errors.reasonDescription)}
                helperText={errors.reasonDescription}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, reasonDescription: event.target.value }));
                  setErrors((prev) => ({ ...prev, reasonDescription: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Reference note"
                multiline
                minRows={3}
                fullWidth
                value={values.referenceNote}
                disabled={submitDisabled}
                error={Boolean(errors.referenceNote)}
                helperText={errors.referenceNote}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, referenceNote: event.target.value }));
                  setErrors((prev) => ({ ...prev, referenceNote: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormGlobalError error={mutation.error} fallbackMessage="Stock operation could not be submitted." />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormActions
                cancelLabel="Cancel"
                submitLabel={config.submitLabel}
                submittingLabel="Submitting..."
                helperText={hasBlockingBusinessWarning ? 'Resolve blocking business warnings before submitting.' : 'After submit, continue from the movement details page if approval or execution is required.'}
                loading={submitDisabled}
                submitDisabled={hasBlockingBusinessWarning}
                onCancel={() => navigate('/stock-movements')}
                onSubmit={handleSubmit}
              />
            </Grid>
          </Grid>
        </SectionCard>
        </>
      ) : null}
    </Stack>
  );
}
