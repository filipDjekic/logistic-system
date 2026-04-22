import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { normalizeApiError } from '../../../core/api/apiError';
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
  const navigate = useNavigate();
  const params = useParams();

  const warehouseId = useMemo(() => Number(params.warehouseId), [params.warehouseId]);
  const productId = useMemo(() => Number(params.productId), [params.productId]);

  const isValidRoute =
    Number.isInteger(warehouseId) &&
    warehouseId > 0 &&
    Number.isInteger(productId) &&
    productId > 0;

  const inventoryRecordQuery = useInventoryRecord(
    isValidRoute ? warehouseId : null,
    isValidRoute ? productId : null,
  );

  if (!isValidRoute) {
    return (
      <ErrorState
        title="Invalid inventory route"
        description="Warehouse ID and product ID must both be positive integers."
      />
    );
  }

  if (inventoryRecordQuery.isLoading) {
    return <InlineLoader message="Loading inventory record..." />;
  }

  if (inventoryRecordQuery.isError || !inventoryRecordQuery.data) {
    const error = normalizeApiError(
      inventoryRecordQuery.error,
      'The requested inventory record was not found or could not be loaded.',
    );

    return (
      <ErrorState
        title={
          error.status === 403
            ? 'Access denied'
            : error.status === 404
              ? 'Inventory record not found'
              : 'Inventory record could not be loaded'
        }
        description={error.message}
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
        overline="Storage"
        title={`${record.warehouseName} · ${record.productName}`}
        description="Detailed inventory record between selected warehouse and product."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() =>
                navigate(`/change-history?entityName=PRODUCT&entityId=${record.productId}`)
              }
            >
              Product history
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                navigate(`/change-history?entityName=WAREHOUSE&entityId=${record.warehouseId}`)
              }
            >
              Warehouse history
            </Button>
            <Button variant="outlined" onClick={() => navigate('/inventory')}>
              Back to list
            </Button>
          </Stack>
        }
      />

      {record.quantity <= record.minStockLevel ? (
        <Alert severity="warning">
          Current quantity is at or below the minimum stock level.
        </Alert>
      ) : null}

      {!warehouse || !product ? (
        <Alert severity="info">
          Core inventory record is loaded, but related warehouse or product lookup is not currently available.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Warehouse">
            <Stack spacing={2}>
              <InfoRow label="Name" value={warehouse?.name ?? record.warehouseName} />
              <InfoRow label="Address" value={warehouse?.address ?? null} />
              <InfoRow label="City" value={warehouse?.city ?? record.warehouseCity} />
              <InfoRow label="Capacity" value={warehouse?.capacity ?? null} />
              <InfoRow label="Status" value={warehouse?.status ?? record.warehouseStatus} />
              {warehouse?.employeeId ? (
                <Button
                  component={RouterLink}
                  to={`/employees/${warehouse.employeeId}`}
                  variant="text"
                  sx={{ alignSelf: 'flex-start', p: 0 }}
                >
                  Open manager profile
                </Button>
              ) : null}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Product">
            <Stack spacing={2}>
              <InfoRow label="Name" value={product?.name ?? record.productName} />
              <InfoRow label="SKU" value={product?.sku ?? record.productSku} />
              <InfoRow label="Unit" value={product?.unit ?? record.productUnit} />
              <InfoRow label="Price" value={product?.price ?? null} />
              <InfoRow
                label="Fragile"
                value={product == null ? null : product.fragile ? 'Yes' : 'No'}
              />
              <InfoRow label="Weight" value={product?.weight ?? null} />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <SectionCard title="Inventory status">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Quantity" value={record.quantity} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Reserved quantity" value={record.reservedQuantity} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Available quantity" value={record.availableQuantity} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <InfoRow label="Minimum stock level" value={record.minStockLevel} />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <InventoryStatusChip status={record.derivedStatus} />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Inventory details are derived from the warehouse inventory backend response and remain scoped by company access.
                </Typography>
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}