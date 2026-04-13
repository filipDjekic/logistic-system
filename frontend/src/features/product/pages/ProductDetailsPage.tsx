import { useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { useProduct } from '../hooks/useProduct';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

export default function ProductDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const productId = Number(params.id);

  const productQuery = useProduct(Number.isFinite(productId) ? productId : null);

  if (!Number.isFinite(productId)) {
    return (
      <ErrorState
        title="Invalid product"
        description="The product ID in the route is not valid."
      />
    );
  }

  if (productQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Catalog"
          title="Product Details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/products')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading product details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <ErrorState
        title="Product could not be loaded"
        description="The requested product details are not available."
        onRetry={() => void productQuery.refetch()}
      />
    );
  }

  const product = productQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Catalog"
        title={product.name}
        description={`Product #${product.id} • SKU ${product.sku}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/change-history?entityName=PRODUCT&entityId=${product.id}`)}
            >
              View history
            </Button>
            <Button variant="outlined" onClick={() => navigate('/products')}>
              Back to list
            </Button>
          </Stack>
        }
      />

      <SectionCard title="Product overview">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Name" value={product.name} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="SKU" value={product.sku} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Unit" value={product.unit} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Price" value={product.price} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Weight" value={product.weight} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Fragile" value={product.fragile ? 'Yes' : 'No'} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Stack alignItems="flex-start">
                <StatusChip value={product.active ? 'ACTIVE' : 'INACTIVE'} />
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <InfoRow label="Company" value={product.companyName ?? '—'} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Description" value={product.description || '—'} />
          </Grid>
        </Grid>
      </SectionCard>
    </Stack>
  );
}
