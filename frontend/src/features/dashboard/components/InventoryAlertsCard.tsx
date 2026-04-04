import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';

type InventoryAlertItem = {
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  minStockLevel: number;
  availableQuantity: number;
};

type InventoryAlertsCardProps = {
  items: InventoryAlertItem[];
};

export default function InventoryAlertsCard({
  items,
}: InventoryAlertsCardProps) {
  const visibleItems = items.slice(0, 6);

  return (
    <SectionCard
      title="Inventory alerts"
      description="Rows where available quantity is at or below min stock level."
    >
      {items.length === 0 ? (
        <EmptyState
          title="No low-stock alerts"
          description="All currently loaded inventory rows are above the configured minimum stock level."
        />
      ) : (
        <Stack spacing={1.5}>
          {visibleItems.map((item) => (
            <Stack
              key={`${item.warehouseId}-${item.productId}`}
              spacing={0.5}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmberRoundedIcon fontSize="small" color="warning" />
                <Typography variant="body2" fontWeight={700}>
                  Warehouse #{item.warehouseId} · Product #{item.productId}
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Available: {item.availableQuantity} · Min stock: {item.minStockLevel}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Quantity: {item.quantity} · Reserved: {item.reservedQuantity}
              </Typography>
            </Stack>
          ))}

          {items.length > visibleItems.length ? (
            <Typography variant="body2" color="text.secondary">
              Showing {visibleItems.length} of {items.length} alerts.
            </Typography>
          ) : null}
        </Stack>
      )}
    </SectionCard>
  );
}