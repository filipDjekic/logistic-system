import { useMemo, useState } from 'react';
import { Alert, Button, CardActionArea, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import BusinessRuleWarnings, { type BusinessRuleWarning } from '../../../shared/components/BusinessRuleWarnings';
import FormActions from '../../../shared/components/Form/FormActions';
import FormProgress from '../../../shared/components/Form/FormProgress';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { EntityLookupField, type LookupOption } from '../../lookup';
import type { StockMovementDiscrepancyReason, StockOperationType } from '../types/stockMovement.types';
import { useCreateStockOperation } from '../hooks/useStockMovements';
import { warehouseLocationsApi } from '../../warehouse-locations/api/warehouseLocationsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';

type StockOperationFormValues = {
  quantity: number | '';
  expectedQuantity: number | '';
  actualQuantity: number | '';
  discrepancyReason: StockMovementDiscrepancyReason | '';
  discrepancyNote: string;
  unitCost: number | '';
  totalCost: number | '';
  currency: string;
  batchLotNumber: string;
  batchExpirationDate: string;
  serialNumbersText: string;
  warehouse: LookupOption | null;
  destinationWarehouse: LookupOption | null;
  product: LookupOption | null;
  binLocation: LookupOption | null;
  destinationBinLocation: LookupOption | null;
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
    description: 'Creates an inbound stock movement. Backend lifecycle decides whether it is directly executable, pending approval or executed by integration flow.',
    submitLabel: 'Submit inbound movement',
  },
  outbound: {
    title: 'Issue stock',
    description: 'Creates an outbound stock movement. Stock is changed only when the backend lifecycle executes the movement.',
    submitLabel: 'Submit outbound movement',
  },
  transfer: {
    title: 'Transfer stock',
    description: 'Moves product quantity from source warehouse to destination warehouse in one backend transaction. Transport order can be selected when transfer follows transport flow.',
    submitLabel: 'Submit transfer movements',
  },
  internal: {
    title: 'Internal bin movement',
    description: 'Moves product quantity from one bin to another bin inside the same warehouse. This creates an internal warehouse movement, not a separate transport flow.',
    submitLabel: 'Create internal movement',
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

const operationOrder: StockOperationType[] = ['inbound', 'outbound', 'transfer', 'internal', 'adjustment', 'write-off', 'return'];
const stockOperationSteps = ['Operation', 'Entities', 'Quantity', 'Reference', 'Submit'];
const discrepancyReasonOptions: StockMovementDiscrepancyReason[] = ['SHORTAGE', 'OVERAGE', 'DAMAGE', 'PICKING_ERROR', 'RECEIVING_ERROR', 'TRANSPORT_LOSS', 'OTHER'];

const initialValues: StockOperationFormValues = {
  quantity: '',
  expectedQuantity: '',
  actualQuantity: '',
  discrepancyReason: '',
  discrepancyNote: '',
  unitCost: '',
  totalCost: '',
  currency: '',
  batchLotNumber: '',
  batchExpirationDate: '',
  serialNumbersText: '',
  warehouse: null,
  destinationWarehouse: null,
  product: null,
  binLocation: null,
  destinationBinLocation: null,
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
  const internalMovementMutation = useMutation({
    mutationFn: warehouseLocationsApi.moveInternal,
    onSuccess: () => {
      showSnackbar({ message: 'Internal movement completed successfully.', severity: 'success' });
      navigate('/stock-movements?tab=internal');
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });
  const { showSnackbar } = useAppSnackbar();
  const [operation, setOperation] = useState<StockOperationType | null>(null);
  const [values, setValues] = useState<StockOperationFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  const config = operation ? operationConfig[operation] : null;
  const isTransfer = operation === 'transfer';
  const isInternal = operation === 'internal';
  const isAdjustment = operation === 'adjustment';
  const usesTransportOrder = operation === 'inbound' || operation === 'outbound' || operation === 'transfer';
  const allowsStockMovementReference = operation === 'outbound' || operation === 'write-off' || operation === 'return';
  const submitDisabled = mutation.isPending || internalMovementMutation.isPending;
  const supportsBinSelection = operation !== null;
  const quantityValue = Number(values.quantity);
  const expectedQuantityValue = values.expectedQuantity === '' ? quantityValue : Number(values.expectedQuantity);
  const actualQuantityValue = values.actualQuantity === '' ? quantityValue : Number(values.actualQuantity);
  const discrepancyQuantity = Number.isFinite(expectedQuantityValue) && Number.isFinite(actualQuantityValue)
    ? actualQuantityValue - expectedQuantityValue
    : 0;
  const hasDiscrepancy = discrepancyQuantity !== 0;

  const businessWarnings: BusinessRuleWarning[] = [];

  const hasBlockingBusinessWarning = businessWarnings.some((warning) => warning.severity === 'error');

  const activeStep = useMemo(() => {
    if (!operation) return 0;
    if (!values.warehouse || !values.product || (isTransfer && !values.destinationWarehouse) || (isInternal && (!values.binLocation || !values.destinationBinLocation))) return 1;
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) return 2;
    if (values.transportOrder || values.stockMovementReference || values.referenceNumber.trim()) return 4;
    return 3;
  }, [isInternal, isTransfer, operation, quantityValue, values.binLocation, values.destinationBinLocation, values.destinationWarehouse, values.product, values.referenceNumber, values.stockMovementReference, values.transportOrder, values.warehouse]);

  const pageDescription = useMemo(() => {
    if (!operation || !config) {
      return 'Choose the stock operation first. The form then shows only fields required by the matching backend endpoint.';
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

    const expectedQuantity = values.expectedQuantity === '' ? quantity : Number(values.expectedQuantity);
    const actualQuantity = values.actualQuantity === '' ? quantity : Number(values.actualQuantity);
    const currentDiscrepancy = actualQuantity - expectedQuantity;

    if (!Number.isFinite(expectedQuantity) || expectedQuantity <= 0) {
      nextErrors.expectedQuantity = 'Expected quantity must be greater than 0';
    }

    if (!Number.isFinite(actualQuantity) || actualQuantity <= 0) {
      nextErrors.actualQuantity = 'Actual quantity must be greater than 0';
    }

    if (currentDiscrepancy !== 0 && !values.discrepancyReason) {
      nextErrors.discrepancyReason = 'Discrepancy reason is required';
    }

    if (currentDiscrepancy !== 0 && ['SHORTAGE', 'DAMAGE', 'TRANSPORT_LOSS'].includes(values.discrepancyReason as string) && values.discrepancyNote.trim().length < 5) {
      nextErrors.discrepancyNote = 'Shortage, damage or transport loss needs a meaningful note';
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

    if ((isTransfer || isInternal) && !values.binLocation) {
      nextErrors.binLocation = 'Source bin is required';
    }

    if ((isTransfer || isInternal) && !values.destinationBinLocation) {
      nextErrors.destinationBinLocation = 'Destination bin is required';
    }

    if (isInternal && values.binLocation && values.destinationBinLocation && values.binLocation.id === values.destinationBinLocation.id) {
      nextErrors.destinationBinLocation = 'Destination bin must be different from source bin';
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

    if (values.discrepancyNote.trim().length > 255) {
      nextErrors.discrepancyNote = 'Discrepancy note must be at most 255 characters';
    }

    const hasUnitCost = values.unitCost !== '';
    const hasTotalCost = values.totalCost !== '';
    const unitCost = hasUnitCost ? Number(values.unitCost) : null;
    const totalCost = hasTotalCost ? Number(values.totalCost) : null;

    if (hasUnitCost && (!Number.isFinite(unitCost) || Number(unitCost) < 0)) {
      nextErrors.unitCost = 'Unit cost cannot be negative';
    }

    if (hasTotalCost && (!Number.isFinite(totalCost) || Number(totalCost) < 0)) {
      nextErrors.totalCost = 'Total cost cannot be negative';
    }

    if ((hasUnitCost || hasTotalCost) && values.currency.trim().length !== 3) {
      nextErrors.currency = 'Currency is required as a 3-letter ISO code';
    }

    if (values.batchLotNumber.trim().length > 100) {
      nextErrors.batchLotNumber = 'Batch/lot number must be at most 100 characters';
    }

    if (values.batchExpirationDate && !values.batchLotNumber.trim()) {
      nextErrors.batchLotNumber = 'Batch/lot number is required when expiration date is set';
    }

    const serialNumbers = values.serialNumbersText.split(/[\n,]+/).map((serial) => serial.trim()).filter(Boolean);
    if (serialNumbers.some((serial) => serial.length > 100)) {
      nextErrors.serialNumbersText = 'Each serial number must be at most 100 characters';
    }

    if (serialNumbers.length > 0 && Number.isInteger(actualQuantity) && serialNumbers.length !== actualQuantity) {
      nextErrors.serialNumbersText = 'Serial number count must match actual quantity';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    if (!operation || !validate() || !values.warehouse || !values.product) {
      return;
    }

    const common = {
      quantity: actualQuantityValue,
      expectedQuantity: expectedQuantityValue,
      actualQuantity: actualQuantityValue,
      reasonDescription: optionalText(values.reasonDescription),
      referenceNumber: resolvedReferenceNumber(operation, values.referenceNumber, values.transportOrder, values.stockMovementReference),
      referenceNote: optionalText(values.referenceNote),
      discrepancyReason: hasDiscrepancy && values.discrepancyReason ? values.discrepancyReason : undefined,
      discrepancyNote: hasDiscrepancy ? optionalText(values.discrepancyNote) : undefined,
      unitCost: values.unitCost === '' ? undefined : Number(values.unitCost),
      totalCost: values.totalCost === '' ? undefined : Number(values.totalCost),
      currency: optionalText(values.currency)?.toUpperCase(),
      batchLotNumber: optionalText(values.batchLotNumber),
      batchExpirationDate: values.batchExpirationDate || undefined,
      serialNumbers: values.serialNumbersText.split(/[\n,]+/).map((serial) => serial.trim()).filter(Boolean),
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


    if (operation === 'internal') {
      if (!values.binLocation || !values.destinationBinLocation) return;

      internalMovementMutation.mutate({
        sourceBinId: values.binLocation.id,
        destinationBinId: values.destinationBinLocation.id,
        productId: values.product.id,
        quantity: Number(values.quantity),
        note: optionalText(values.referenceNote) ?? optionalText(values.reasonDescription) ?? null,
      });
      return;
    }

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
            sourceBinLocationId: values.binLocation?.id,
            destinationBinLocationId: values.destinationBinLocation?.id,
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
            binLocationId: values.binLocation?.id,
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
            binLocationId: values.binLocation?.id,
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
            binLocationId: values.binLocation?.id,
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
          binLocationId: values.binLocation?.id,
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

      <Alert severity="info">
        Submit creates a lifecycle-controlled stock movement. Use the details page after submit for Execute, Approve, Reject, Cancel or Reverse actions when the backend allows them.
      </Alert>

      <SectionCard title="1. Choose operation" description="Pick the operational intent first. The remaining form is scoped to the matching backend endpoint.">
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
        <SectionCard title="2. Entities and locations" description="Select the operational entities first. Dynamic references use lookup/search fields; enum values stay as dropdowns.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <EntityLookupField
                label={isTransfer ? 'Source warehouse' : 'Warehouse'}
                entityType="warehouses"
                value={values.warehouse}
                required
                disabledOptionIds={values.destinationWarehouse ? [values.destinationWarehouse.id] : []}
                activeOnly
                searchPlaceholder="Search warehouses by name, city or code..."
                onChange={(warehouse) => {
                  setValues((prev) => ({ ...prev, warehouse, binLocation: null, destinationBinLocation: isInternal ? null : prev.destinationBinLocation }));
                  setErrors((prev) => ({ ...prev, warehouse: undefined, binLocation: undefined }));
                }}
              />
              {errors.warehouse ? <Typography variant="caption" color="error">{errors.warehouse}</Typography> : null}
            </Grid>

            {isTransfer ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <EntityLookupField
                  label="Destination warehouse"
                  entityType="warehouses"
                  value={values.destinationWarehouse}
                  required
                  disabledOptionIds={values.warehouse ? [values.warehouse.id] : []}
                  activeOnly
                  searchPlaceholder="Search destination warehouses..."
                  onChange={(destinationWarehouse) => {
                    setValues((prev) => ({ ...prev, destinationWarehouse, destinationBinLocation: null }));
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
                searchPlaceholder="Search products by name or SKU..."
                onChange={(product) => {
                  setValues((prev) => ({ ...prev, product }));
                  setErrors((prev) => ({ ...prev, product: undefined }));
                }}
              />
              {errors.product ? <Typography variant="caption" color="error">{errors.product}</Typography> : null}
            </Grid>

            {supportsBinSelection ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <EntityLookupField
                  label={isTransfer || isInternal ? 'Source bin location' : 'Bin location'}
                  entityType="bin-locations"
                  value={values.binLocation}
                  disabled={submitDisabled || !values.warehouse}
                  error={Boolean(errors.binLocation)}
                  helperText={errors.binLocation ?? (isTransfer || isInternal ? 'Required for bin-to-bin movement.' : 'Optional. Empty value updates only warehouse inventory.')}
                  placeholder={values.warehouse ? 'No bin selected' : 'Choose warehouse first'}
                  searchPlaceholder="Search bins by code, name, zone or warehouse..."
                  warehouseId={values.warehouse?.id}
                  activeOnly
                  sort="code,asc"
                  onChange={(binLocation) => {
                    setValues((prev) => ({ ...prev, binLocation }));
                    setErrors((prev) => ({ ...prev, binLocation: undefined }));
                  }}
                />
              </Grid>
            ) : null}

            {(isTransfer || isInternal) ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <EntityLookupField
                  label="Destination bin location"
                  entityType="bin-locations"
                  value={values.destinationBinLocation}
                  disabled={submitDisabled || (isTransfer ? !values.destinationWarehouse : !values.warehouse)}
                  error={Boolean(errors.destinationBinLocation)}
                  helperText={errors.destinationBinLocation ?? (isInternal ? 'Required. Internal movement destination stays inside the same warehouse.' : 'Required for transfer destination when using bins.')}
                  placeholder={(isTransfer ? values.destinationWarehouse : values.warehouse) ? 'No destination bin selected' : 'Choose warehouse first'}
                  searchPlaceholder="Search destination bins by code, name, zone or warehouse..."
                  warehouseId={(isTransfer ? values.destinationWarehouse : values.warehouse)?.id}
                  activeOnly
                  sort="code,asc"
                  onChange={(destinationBinLocation) => {
                    setValues((prev) => ({ ...prev, destinationBinLocation }));
                    setErrors((prev) => ({ ...prev, destinationBinLocation: undefined }));
                  }}
                />
              </Grid>
            ) : null}

            <Grid size={{ xs: 12 }}>
              <BusinessRuleWarnings warnings={businessWarnings} />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard title="3. Quantity and operation details" description="Enter the quantity and operation-specific values. Blocking warnings prevent submit before the request reaches backend.">
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

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Expected quantity"
                type="number"
                fullWidth
                value={values.expectedQuantity}
                disabled={submitDisabled}
                error={Boolean(errors.expectedQuantity)}
                helperText={errors.expectedQuantity ?? 'Optional. Empty value uses entered quantity.'}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setValues((prev) => ({ ...prev, expectedQuantity: nextValue === '' ? '' : Number(nextValue) }));
                  setErrors((prev) => ({ ...prev, expectedQuantity: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Actual quantity"
                type="number"
                fullWidth
                value={values.actualQuantity}
                disabled={submitDisabled}
                error={Boolean(errors.actualQuantity)}
                helperText={errors.actualQuantity ?? 'Optional. Empty value uses entered quantity. Actual quantity is used as movement quantity.'}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setValues((prev) => ({ ...prev, actualQuantity: nextValue === '' ? '' : Number(nextValue), quantity: nextValue === '' ? prev.quantity : Number(nextValue) }));
                  setErrors((prev) => ({ ...prev, actualQuantity: undefined, quantity: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Discrepancy reason"
                value={values.discrepancyReason}
                disabled={submitDisabled || !hasDiscrepancy}
                error={Boolean(errors.discrepancyReason)}
                helperText={errors.discrepancyReason ?? (hasDiscrepancy ? `Discrepancy: ${discrepancyQuantity}` : 'No reason required when expected and actual match.')}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, discrepancyReason: event.target.value as StockMovementDiscrepancyReason }));
                  setErrors((prev) => ({ ...prev, discrepancyReason: undefined }));
                }}
              >
                <MenuItem value="">None</MenuItem>
                {discrepancyReasonOptions.map((reason) => (
                  <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Discrepancy note"
                fullWidth
                value={values.discrepancyNote}
                disabled={submitDisabled || !hasDiscrepancy}
                error={Boolean(errors.discrepancyNote)}
                helperText={errors.discrepancyNote ?? 'Required for shortage, damage or transport loss.'}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, discrepancyNote: event.target.value }));
                  setErrors((prev) => ({ ...prev, discrepancyNote: undefined }));
                }}
              />
            </Grid>


            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Unit cost"
                type="number"
                fullWidth
                value={values.unitCost}
                disabled={submitDisabled}
                error={Boolean(errors.unitCost)}
                helperText={errors.unitCost ?? 'Optional cost per unit for valuation.'}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setValues((prev) => ({ ...prev, unitCost: nextValue === '' ? '' : Number(nextValue) }));
                  setErrors((prev) => ({ ...prev, unitCost: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Total cost"
                type="number"
                fullWidth
                value={values.totalCost}
                disabled={submitDisabled}
                error={Boolean(errors.totalCost)}
                helperText={errors.totalCost ?? 'Optional total movement value.'}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setValues((prev) => ({ ...prev, totalCost: nextValue === '' ? '' : Number(nextValue) }));
                  setErrors((prev) => ({ ...prev, totalCost: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Currency"
                fullWidth
                value={values.currency}
                disabled={submitDisabled}
                error={Boolean(errors.currency)}
                helperText={errors.currency ?? 'ISO code, e.g. RSD, EUR, USD.'}
                inputProps={{ maxLength: 3 }}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }));
                  setErrors((prev) => ({ ...prev, currency: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Batch / lot number"
                fullWidth
                value={values.batchLotNumber}
                disabled={submitDisabled}
                error={Boolean(errors.batchLotNumber)}
                helperText={errors.batchLotNumber ?? 'Optional batch/lot tracking for this movement.'}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, batchLotNumber: event.target.value }));
                  setErrors((prev) => ({ ...prev, batchLotNumber: undefined }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Batch expiration date"
                type="date"
                fullWidth
                value={values.batchExpirationDate}
                disabled={submitDisabled}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setValues((prev) => ({ ...prev, batchExpirationDate: event.target.value }))}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Serial numbers"
                multiline
                minRows={3}
                fullWidth
                value={values.serialNumbersText}
                disabled={submitDisabled}
                error={Boolean(errors.serialNumbersText)}
                helperText={errors.serialNumbersText ?? 'Optional. Separate serial numbers by comma or new line.'}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, serialNumbersText: event.target.value }));
                  setErrors((prev) => ({ ...prev, serialNumbersText: undefined }));
                }}
              />
            </Grid>

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

        <SectionCard title="4. Reference context" description="Attach transport or stock movement context where it belongs. Manual reference number is still allowed for standalone operations.">
          <Grid container spacing={2}>
            {usesTransportOrder ? (
              <Grid size={{ xs: 12 }}>
                <EntityLookupField
                  label="Transport order reference"
                  entityType="transport-orders"
                  value={values.transportOrder}
                  searchPlaceholder="Search transport orders..."
                  onChange={(transportOrder) => {
                    setValues((prev) => ({
                      ...prev,
                      transportOrder,
                      stockMovementReference: null,
                      referenceNumber: prev.referenceNumber || transportOrder?.label || '',
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
                      transportOrder: null,
                      referenceNumber: prev.referenceNumber || referenceNumberFromStockMovement(stockMovementReference) || '',
                    }));
                  }}
                />
              </Grid>
            ) : null}

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

          </Grid>
        </SectionCard>

        <SectionCard title="5. Review and submit" description="Submit creates the movement and opens its details page, where lifecycle actions are handled explicitly.">
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
              <FormGlobalError error={mutation.error ?? internalMovementMutation.error} fallbackMessage="Stock operation could not be submitted." />
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
