import { useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { useWarehouse } from '../hooks/useWarehouse';

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

export default function WarehouseDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const warehouseId = Number(params.id);

  const warehouseQuery = useWarehouse(Number.isFinite(warehouseId) ? warehouseId : null);

  if (!Number.isFinite(warehouseId)) {
    return (
      <ErrorState
        title="Invalid warehouse"
        description="The warehouse ID in the route is not valid."
      />
    );
  }

  if (warehouseQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Storage"
          title="Warehouse Details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/warehouses')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading warehouse details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (warehouseQuery.isError || !warehouseQuery.data) {
    return (
      <ErrorState
        title="Warehouse could not be loaded"
        description="The requested warehouse details are not available."
        onRetry={() => void warehouseQuery.refetch()}
      />
    );
  }

  const warehouse = warehouseQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Storage"
        title={warehouse.name}
        description={`Warehouse #${warehouse.id} • ${warehouse.city}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/change-history?entityName=WAREHOUSE&entityId=${warehouse.id}`)}
            >
              View history
            </Button>
            <Button variant="outlined" onClick={() => navigate('/warehouses')}>
              Back to list
            </Button>
          </Stack>
        }
      />

      <SectionCard title="Warehouse overview">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Name" value={warehouse.name} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="City" value={warehouse.city} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Address" value={warehouse.address} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Capacity" value={warehouse.capacity} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Stack alignItems="flex-start">
                <StatusChip value={warehouse.status} />
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
              <Stack alignItems="flex-start">
                <StatusChip value={warehouse.active ? 'ACTIVE' : 'INACTIVE'} />
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title="Ownership and assignment">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Manager employee ID" value={warehouse.employeeId ?? '—'} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Manager name" value={warehouse.managerName ?? '—'} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Company" value={warehouse.companyName ?? '—'} />
          </Grid>
        </Grid>
      </SectionCard>
    </Stack>
  );
}
