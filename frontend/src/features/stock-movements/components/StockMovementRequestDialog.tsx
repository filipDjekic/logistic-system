import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { stockMovementsApi } from '../api/stockMovementsApi';
import type { StockAdjustmentDirection, StockMovementRequestPayload } from '../types/stockMovement.types';

type RequestMovementType = StockMovementRequestPayload['movementType'];

type Props = {
  open: boolean;
  onClose: () => void;
};

const movementTypes: Array<{ value: RequestMovementType; label: string }> = [
  { value: 'INBOUND', label: 'Inbound' },
  { value: 'OUTBOUND', label: 'Outbound' },
  { value: 'TRANSFER_OUT', label: 'Transfer' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'WRITE_OFF', label: 'Write-off' },
  { value: 'RETURN_IN', label: 'Return' },
];

export default function StockMovementRequestDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const snackbar = useAppSnackbar();
  const [movementType, setMovementType] = useState<RequestMovementType>('OUTBOUND');
  const [quantity, setQuantity] = useState('');
  const [adjustmentDirection, setAdjustmentDirection] = useState<StockAdjustmentDirection>('INCREASE');
  const [reasonDescription, setReasonDescription] = useState('');
  const [warehouse, setWarehouse] = useState<LookupOption | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<LookupOption | null>(null);
  const [product, setProduct] = useState<LookupOption | null>(null);

  const mutation = useMutation({
    mutationFn: stockMovementsApi.createRequest,
    onSuccess: () => {
      snackbar.showSnackbar({ message: 'Stock movement request submitted.', severity: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements.root() });
      handleClose();
    },
    onError: (error) => snackbar.showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });

  const handleClose = () => {
    if (mutation.isPending) {
      return;
    }
    onClose();
  };

  const handleSubmit = () => {
    const numericQuantity = Number(quantity);
    if (!warehouse || !product || !Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      snackbar.showSnackbar({ message: 'Warehouse, product and positive quantity are required.', severity: 'error' });
      return;
    }
    if (movementType === 'TRANSFER_OUT' && !destinationWarehouse) {
      snackbar.showSnackbar({ message: 'Destination warehouse is required for transfer request.', severity: 'error' });
      return;
    }

    mutation.mutate({
      movementType,
      quantity: numericQuantity,
      adjustmentDirection: movementType === 'ADJUSTMENT' ? adjustmentDirection : undefined,
      reasonDescription: reasonDescription.trim() || undefined,
      warehouseId: warehouse.id,
      destinationWarehouseId: movementType === 'TRANSFER_OUT' ? destinationWarehouse?.id : undefined,
      productId: product.id,
    });
  };

  const transfer = movementType === 'TRANSFER_OUT';
  const adjustment = movementType === 'ADJUSTMENT';
  const requiresExistingStock = movementType === 'OUTBOUND'
    || movementType === 'TRANSFER_OUT'
    || movementType === 'WRITE_OFF'
    || (movementType === 'ADJUSTMENT' && adjustmentDirection === 'DECREASE');

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Request movement</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This creates a request for your scoped warehouse. A warehouse manager must approve it before a real stock movement is created.
          </Typography>
          <TextField select label="Movement type" value={movementType} onChange={(event) => {
            setMovementType(event.target.value as RequestMovementType);
            setProduct(null);
            setDestinationWarehouse(null);
          }} fullWidth>
            {movementTypes.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </TextField>
          <EntityLookupField
            label="Warehouse"
            entityType="warehouses"
            value={warehouse}
            required
            activeOnly
            disabledOptionIds={destinationWarehouse ? [destinationWarehouse.id] : []}
            onChange={(value) => {
              setWarehouse(value);
              setProduct(null);
            }}
            searchPlaceholder="Search assigned warehouses..."
          />
          {transfer ? (
            <EntityLookupField
              label="Destination warehouse"
              entityType="warehouses"
              value={destinationWarehouse}
              required
              activeOnly
              disabledOptionIds={warehouse ? [warehouse.id] : []}
              onChange={(value) => {
                setDestinationWarehouse(value);
              }}
              searchPlaceholder="Search destination warehouses..."
            />
          ) : null}
          <EntityLookupField
            label="Product"
            entityType="products"
            value={product}
            required
            activeOnly
            warehouseId={requiresExistingStock ? warehouse?.id : undefined}
            lookupParams={{ mode: requiresExistingStock ? 'AVAILABLE_STOCK' : 'REFERENCE' }}
            disabled={requiresExistingStock && !warehouse}
            placeholder={requiresExistingStock && !warehouse ? 'Choose warehouse first' : 'Not selected'}
            onChange={setProduct}
            searchPlaceholder="Search products..."
          />
          <TextField label="Quantity" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} fullWidth inputProps={{ min: 0, step: '0.01' }} />
          {adjustment ? (
            <TextField select label="Adjustment direction" value={adjustmentDirection} onChange={(event) => {
              setAdjustmentDirection(event.target.value as StockAdjustmentDirection);
              setProduct(null);
            }} fullWidth>
              <MenuItem value="INCREASE">Increase</MenuItem>
              <MenuItem value="DECREASE">Decrease</MenuItem>
            </TextField>
          ) : null}
          <TextField label="Reason" value={reasonDescription} onChange={(event) => setReasonDescription(event.target.value)} fullWidth multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>Submit request</Button>
      </DialogActions>
    </Dialog>
  );
}
