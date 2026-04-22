import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { warehousesApi } from '../api/warehousesApi';
import { useWarehouse } from '../hooks/useWarehouse';
import type { WarehouseStatus } from '../types/warehouse.types';

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

function getAllowedNextStatuses(status: WarehouseStatus): WarehouseStatus[] {
  switch (status) {
    case 'ACTIVE':
      return ['INACTIVE', 'FULL', 'UNDER_MAINTENANCE'];
    case 'INACTIVE':
      return ['ACTIVE'];
    case 'FULL':
      return ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];
    case 'UNDER_MAINTENANCE':
      return ['ACTIVE', 'INACTIVE'];
    default:
      return [];
  }
}

export default function WarehouseDetailsPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const warehouseId = Number(params.id);

  const canManage =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const warehouseQuery = useWarehouse(Number.isFinite(warehouseId) ? warehouseId : null);
  const warehouse = warehouseQuery.data;

  const nextStatuses = useMemo(
    () => (warehouse ? getAllowedNextStatuses(warehouse.status) : []),
    [warehouse],
  );

  const [selectedStatus, setSelectedStatus] = useState<WarehouseStatus | ''>('');

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: WarehouseStatus }) =>
      warehousesApi.changeStatus(id, status),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Warehouse status updated to ${variables.status}.`,
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
        queryClient.invalidateQueries({
          queryKey: ['warehouses', 'details', variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
      ]);

      setSelectedStatus('');
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });

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
          title="Warehouse details"
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

  if (warehouseQuery.isError || !warehouse) {
    return (
      <ErrorState
        title="Warehouse could not be loaded"
        description="The requested warehouse details are not available."
        onRetry={() => void warehouseQuery.refetch()}
      />
    );
  }

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
              onClick={() =>
                navigate(`/change-history?entityName=WAREHOUSE&entityId=${warehouse.id}`)
              }
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

      {canManage ? (
        <SectionCard
          title="Status change"
          description="Uses the dedicated backend warehouse status endpoint with backend validation."
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              select
              size="small"
              label="Next status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as WarehouseStatus)}
              sx={{ minWidth: { xs: '100%', md: 260 } }}
              disabled={nextStatuses.length === 0 || changeStatusMutation.isPending}
            >
              {nextStatuses.length === 0 ? (
                <MenuItem value="" disabled>
                  No available transitions
                </MenuItem>
              ) : (
                nextStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))
              )}
            </TextField>

            <Button
              variant="contained"
              disabled={!selectedStatus || changeStatusMutation.isPending}
              onClick={() => {
                if (!selectedStatus) {
                  return;
                }

                changeStatusMutation.mutate({
                  id: warehouse.id,
                  status: selectedStatus,
                });
              }}
            >
              Update status
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Final validation stays on the backend. If the warehouse has inventory or
            active transport constraints, the backend validation message will be shown.
          </Typography>
        </SectionCard>
      ) : null}
    </Stack>
  );
}