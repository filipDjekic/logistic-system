import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { StockMovementSearchSelect } from './StockMovementSearchSelect';
import { TransportOrderSearchSelect } from './TransportOrderSearchSelect';

export type LinkedProcessType = 'TRANSPORT_ORDER' | 'STOCK_MOVEMENT' | 'UNLINKED';

export type LinkedProcessSelection = {
  type: LinkedProcessType;
  id: number | null;
};

export type LinkedProcessSearchSelectProps = {
  value: LinkedProcessSelection;
  onChange: (selection: LinkedProcessSelection) => void;
};

export function LinkedProcessSearchSelect({ value, onChange }: LinkedProcessSearchSelectProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>
          Linked process
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose whether task is linked to another process.
        </Typography>
      </Box>

      <ToggleButtonGroup
        exclusive
        value={value.type}
        onChange={(_, nextValue: LinkedProcessType | null) => {
          if (!nextValue) return;
          onChange({ type: nextValue, id: null });
        }}
        size="small"
      >
        <ToggleButton value="UNLINKED">Unlinked</ToggleButton>
        <ToggleButton value="TRANSPORT_ORDER">Transport order</ToggleButton>
        <ToggleButton value="STOCK_MOVEMENT">Stock movement</ToggleButton>
      </ToggleButtonGroup>

      {value.type === 'TRANSPORT_ORDER' ? (
        <TransportOrderSearchSelect
          value={value.id}
          onSelect={(transportOrder) => onChange({ type: 'TRANSPORT_ORDER', id: transportOrder.id })}
        />
      ) : null}

      {value.type === 'STOCK_MOVEMENT' ? (
        <StockMovementSearchSelect
          value={value.id}
          onSelect={(stockMovement) => onChange({ type: 'STOCK_MOVEMENT', id: stockMovement.id })}
        />
      ) : null}
    </Stack>
  );
}
