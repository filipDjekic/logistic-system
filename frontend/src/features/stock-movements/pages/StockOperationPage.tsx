import { useMemo, useState } from 'react';
import { Alert, Button, CardActionArea, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { ProductSearchSelect, StockMovementSearchSelect, TransportOrderSearchSelect, WarehouseSearchSelect } from '../../search-select';
import type { ProductResponse } from '../../product/types/product.types';
import type { StockMovementResponse, StockOperationType } from '../types/stockMovement.types';
import type { TransportOrderResponse } from '../../transport-orders/types/transportOrder.types';
import type { WarehouseResponse } from '../../warehouses/types/warehouse.types';
import { useCreateStockOperation } from '../hooks/useStockMovements';
import { inventoryApi } from '../../inventory/api/inventoryApi';

type StockOperationFormValues = {
  quantity: number | '';
  warehouse: WarehouseResponse | null;
  destinationWarehouse: WarehouseResponse | null;
  product: ProductResponse | null;
  transportOrder: TransportOrderResponse | null;
  stockMovementReference: StockMovementResponse | null;
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
    description: 'Adds product quantity into selected warehouse. Transport order can be selected as reference. If no reference is selected, a manual reference number is generated.',
    submitLabel: 'Create inbound movement',
  },
  outbound: {
    title: 'Issue stock',
    description: 'Removes product quantity from selected warehouse. Transport order or related stock movement can be selected as reference.',
    submitLabel: 'Create outbound movement',
  },
  transfer: {
    title: 'Transfer stock',
    description: 'Moves product quantity from source warehouse to destination warehouse in one backend transaction. Transport order can be selected when transfer follows transport flow.',
    submitLabel: 'Create transfer movements',
  },
  adjustment: {
    title: 'Adjust stock',
    description: 'Corrects stock using backend adjustment direction. No external document ID is entered; reference number is optional and generated when empty.',
    submitLabel: 'Create adjustment movement',
  },
  'write-off': {
    title: 'Write off stock',
    description: 'Removes damaged, missing or unusable product quantity from warehouse stock. Related stock movement can be selected when the write-off follows an existing movement.',
    submitLabel: 'Create write-off movement',
  },
  return: {
    title: 'Return stock',
    description: 'Returns product quantity into selected warehouse stock. Related stock movement can be selected when the return follows an existing movement.',
    submitLabel: 'Create return movement',
  },
};

const operationOrder: StockOperationType[] = ['inbound', 'outbound', 'transfer', 'adjustment', 'write-off', 'return'];

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

function referenceNumberFromTransportOrder(transportOrder: TransportOrderResponse | null) {
  return transportOrder?.orderNumber?.trim() || undefined;
}

function referenceNumberFromStockMovement(stockMovement: StockMovementResponse | null) {
  if (!stockMovement) {
    return undefined;
  }

  return stockMovement.referenceNumber?.trim() || `STOCK_MOVEMENT_${stockMovement.id}`;
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

function sumWarehouseQuantity(rows: Array<{ quantity: number }>) {
  return rows.reduce((total, row) => total + Number(row.quantity || 0), 0);
}

function exceedsWarehouseCapacity(warehouse: WarehouseResponse | null, currentQuantity: number | null, addedQuantity: number) {
  if (!warehouse || currentQuantity === null || !Number.isFinite(warehouse.capacity)) {
    return false;
  }

  return currentQuantity + addedQuantity > Number(warehouse.capacity);
}

function resolvedReferenceNumber(
  operation: StockOperationType,
  typedReferenceNumber: string,
  transportOrder: TransportOrderResponse | null,
  stockMovementReference: StockMovementResponse | null,
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
  const usesTransportOrder = operation === 'inbound' || operation === 'outbound' || operation === 'transfer';
  const allowsStockMovementReference = operation === 'outbound' || operation === 'write-off' || operation === 'return';
  const submitDisabled = mutation.isPending;
  const quantityValue = Number(values.quantity);

  const checksSourceWarehouseCapacity =
    operation === 'inbound' ||
    operation === 'return' ||
    (operation === 'adjustment' && values.adjustmentDirection === 'INCREASE');

  const sourceInventoryQuery = useQuery({
    queryKey: queryKeys.stockMovements.operationWarehouseInventory(values.warehouse?.id),
    queryFn: () => inventoryApi.getInventoryByWarehouse(values.warehouse!.id),
    enabled: Boolean(values.warehouse?.id && checksSourceWarehouseCapacity),
  });

  const destinationInventoryQuery = useQuery({
    queryKey: queryKeys.stockMovements.operationWarehouseInventory(values.destinationWarehouse?.id),
    queryFn: () => inventoryApi.getInventoryByWarehouse(values.destinationWarehouse!.id),
    enabled: Boolean(values.destinationWarehouse?.id && operation === 'transfer'),
  });

  const sourceWarehouseQuantity = sourceInventoryQuery.data ? sumWarehouseQuantity(sourceInventoryQuery.data) : null;
  const destinationWarehouseQuantity = destinationInventoryQuery.data ? sumWarehouseQuantity(destinationInventoryQuery.data) : null;

  const sourceCapacityExceeded = checksSourceWarehouseCapacity && Number.isFinite(quantityValue)
    ? exceedsWarehouseCapacity(values.warehouse, sourceWarehouseQuantity, quantityValue)
    : false;

  const destinationCapacityExceeded = operation === 'transfer' && Number.isFinite(quantityValue)
    ? exceedsWarehouseCapacity(values.destinationWarehouse, destinationWarehouseQuantity, quantityValue)
    : false;

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

    if (values.transportOrder && values.warehouse) {
      if ((operation === 'outbound' || operation === 'transfer') && values.transportOrder.sourceWarehouseId !== values.warehouse.id) {
        nextErrors.warehouse = 'Source warehouse must match selected transport order';
      }

      if (operation === 'inbound' && values.transportOrder.destinationWarehouseId !== values.warehouse.id) {
        nextErrors.warehouse = 'Warehouse must match selected transport order destination';
      }
    }

    if (operation === 'transfer' && values.transportOrder && values.destinationWarehouse) {
      if (values.transportOrder.destinationWarehouseId !== values.destinationWarehouse.id) {
        nextErrors.destinationWarehouse = 'Destination warehouse must match selected transport order destination';
      }
    }

    if (!values.product) {
      nextErrors.product = 'Product is required';
    }

    if (sourceCapacityExceeded) {
      nextErrors.warehouse = 'Warehouse capacity would be exceeded';
    }

    if (destinationCapacityExceeded) {
      nextErrors.destinationWarehouse = 'Destination warehouse capacity would be exceeded';
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
    if (!operation || !validate() || !values.warehouse || !values.product) {
      return;
    }

    const common = {
      quantity: Number(values.quantity),
      reasonDescription: optionalText(values.reasonDescription),
      referenceNumber: resolvedReferenceNumber(operation, values.referenceNumber, values.transportOrder, values.stockMovementReference),
      referenceNote: optionalText(values.referenceNote),
    };

    const selectedReferenceId = values.transportOrder?.id ?? values.stockMovementReference?.id;

    const afterSuccess = () => {
      navigate(`/inventory/${values.warehouse?.id}/${values.product?.id}`);
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

      <SectionCard title="1. Choose operation" description="Backend remains split by operation; this page only chooses which endpoint will be used.">
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
        <SectionCard title={`2. ${config.title} data`} description="Selectable entities use the shared search/result-box components. Fixed values stay as dropdowns. Reference number is optional.">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <WarehouseSearchSelect
                title={isTransfer ? 'Select source warehouse' : 'Select warehouse'}
                value={values.warehouse?.id ?? null}
                active
                disabledWarehouseIds={values.destinationWarehouse ? [values.destinationWarehouse.id] : []}
                onSelect={(warehouse) => {
                  setValues((prev) => ({ ...prev, warehouse }));
                  setErrors((prev) => ({ ...prev, warehouse: undefined }));
                }}
              />
              {errors.warehouse ? <Typography variant="caption" color="error">{errors.warehouse}</Typography> : null}
            </Grid>

            {isTransfer ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <WarehouseSearchSelect
                  title="Select destination warehouse"
                  value={values.destinationWarehouse?.id ?? null}
                  active
                  disabledWarehouseIds={values.warehouse ? [values.warehouse.id] : []}
                  onSelect={(destinationWarehouse) => {
                    setValues((prev) => ({ ...prev, destinationWarehouse }));
                    setErrors((prev) => ({ ...prev, destinationWarehouse: undefined }));
                  }}
                />
                {errors.destinationWarehouse ? <Typography variant="caption" color="error">{errors.destinationWarehouse}</Typography> : null}
              </Grid>
            ) : null}

            <Grid size={{ xs: 12, md: 6 }}>
              <ProductSearchSelect
                title="Select product"
                value={values.product?.id ?? null}
                activeOnly
                onSelect={(product) => {
                  setValues((prev) => ({ ...prev, product }));
                  setErrors((prev) => ({ ...prev, product: undefined }));
                }}
              />
              {errors.product ? <Typography variant="caption" color="error">{errors.product}</Typography> : null}
            </Grid>

            {(sourceCapacityExceeded || destinationCapacityExceeded) ? (
              <Grid size={{ xs: 12 }}>
                <Alert severity="error">
                  Warehouse capacity would be exceeded. Current occupied quantity is checked from inventory records before submit.
                </Alert>
              </Grid>
            ) : null}

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

            {usesTransportOrder ? (
              <Grid size={{ xs: 12 }}>
                <TransportOrderSearchSelect
                  title="Select transport order reference"
                  value={values.transportOrder?.id ?? null}
                  onSelect={(transportOrder) => {
                    setValues((prev) => ({
                      ...prev,
                      transportOrder,
                      stockMovementReference: null,
                      referenceNumber: prev.referenceNumber || transportOrder.orderNumber,
                    }));
                  }}
                />
              </Grid>
            ) : null}

            {allowsStockMovementReference ? (
              <Grid size={{ xs: 12 }}>
                <StockMovementSearchSelect
                  title="Select related stock movement reference"
                  value={values.stockMovementReference?.id ?? null}
                  onSelect={(stockMovementReference) => {
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/stock-movements')} disabled={submitDisabled}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitDisabled}>
                  {config.submitLabel}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </SectionCard>
      ) : null}
    </Stack>
  );
}
