import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import InventoryStatusChip from '../components/InventoryStatusChip';
import { useInventoryRecord } from '../hooks/useInventoryRecord';

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value === null || value === undefined || value === '' ? '—' : String(value)}
      </Typography>
    </Stack>
  );
}

export default function InventoryDetailsPage() {
  const params = useParams();
  const warehouseId = useMemo(
    () => Number(params.warehouseId),
    [params.warehouseId],
  );
  const productId = useMemo(
    () => Number(params.productId),
    [params.productId],
  );

  const inventoryRecordQuery = useInventoryRecord(
    Number.isFinite(warehouseId) ? warehouseId : null,
    Number.isFinite(productId) ? productId : null,
  );

  if (!Number.isFinite(warehouseId) || !Number.isFinite(productId)) {
    return (
      <ErrorState
        title="Invalid inventory route"
        description="Warehouse ID and product ID must both be valid numbers."
      />
    );
  }

  if (inventoryRecordQuery.isLoading) {
    return <InlineLoader message="Loading inventory record..." />;
  }

  if (inventoryRecordQuery.isError || !inventoryRecordQuery.data) {
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

  const { record, warehouse, product } = inventoryRecordQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Inventory"
        title={`${record.productName} · ${record.warehouseName}`}
        description="Inventory record details resolved through the warehouse and product composite key."
        actions={
          <Button component={RouterLink} to="/inventory" variant="outlined">
            Back to inventory
          </Button>
        }
      />

      <Alert severity="info">
        This screen shows the exact inventory record from
        <strong> /api/warehouse-inventory/{`{warehouseId}/{productId}`}</strong>
        and enriches it with warehouse and product lookup data.
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard title="Inventory state">
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Typography variant="h6">Current status</Typography>
                <InventoryStatusChip status={record.derivedStatus} />
              </Stack>

              <Divider />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow label="Total quantity" value={`${record.quantity} ${record.productUnit}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow label="Reserved quantity" value={`${record.reservedQuantity} ${record.productUnit}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow label="Available quantity" value={`${record.availableQuantity} ${record.productUnit}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow
                    label="Minimum stock level"
                    value={
                      record.minStockLevel === null
                        ? '—'
                        : `${record.minStockLevel} ${record.productUnit}`
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow label="Warehouse ID" value={record.warehouseId} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow label="Product ID" value={record.productId} />
                </Grid>
              </Grid>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <SectionCard title="Warehouse">
              <Stack spacing={2}>
                <InfoRow label="Name" value={warehouse?.name} />
                <InfoRow label="City" value={warehouse?.city} />
                <InfoRow label="Address" value={warehouse?.address} />
                <InfoRow label="Capacity" value={warehouse?.capacity} />
                <InfoRow label="Status" value={warehouse?.status} />
                <InfoRow label="Manager employee ID" value={warehouse?.employeeId} />
              </Stack>
            </SectionCard>

            <SectionCard title="Product">
              <Stack spacing={2}>
                <InfoRow label="Name" value={product?.name} />
                <InfoRow label="SKU" value={product?.sku} />
                <InfoRow label="Unit" value={product?.unit} />
                <InfoRow label="Price" value={product?.price} />
                <InfoRow label="Weight" value={product?.weight} />
                <InfoRow label="Fragile" value={product?.fragile} />
                <InfoRow label="Description" value={product?.description} />
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}