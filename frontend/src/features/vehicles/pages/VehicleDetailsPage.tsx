import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import VehicleStatusChip from '../components/VehicleStatusChip';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { vehiclesApi } from '../api/vehiclesApi';
import { useVehicle } from '../hooks/useVehicle';
import type { VehicleStatus } from '../types/vehicle.types';

function formatCapacity(value: number) {
  return `${value} kg`;
}

function getAllowedNextStatuses(status: VehicleStatus): VehicleStatus[] {
  switch (status) {
    case 'AVAILABLE':
      return ['IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    case 'IN_USE':
      return ['AVAILABLE'];
    case 'MAINTENANCE':
      return ['AVAILABLE', 'OUT_OF_SERVICE'];
    case 'OUT_OF_SERVICE':
      return ['AVAILABLE', 'MAINTENANCE'];
    default:
      return [];
  }
}

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  const vehicleId = Number(params.id);

  const vehicleQuery = useVehicle(Number.isFinite(vehicleId) ? vehicleId : null);
  const vehicle = vehicleQuery.data;

  const nextStatuses = useMemo(
    () => (vehicle ? getAllowedNextStatuses(vehicle.status) : []),
    [vehicle],
  );

  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | ''>('');

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: VehicleStatus }) =>
      vehiclesApi.changeStatus(id, status),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: `Vehicle status updated to ${variables.status}.`,
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles', 'details', variables.id] }),
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

  if (!Number.isFinite(vehicleId)) {
    return (
      <ErrorState
        title="Invalid vehicle"
        description="The vehicle ID in the route is not valid."
      />
    );
  }

  if (vehicleQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Fleet"
          title="Vehicle Details"
          actions={
            <Button variant="outlined" onClick={() => navigate('/vehicles')}>
              Back to list
            </Button>
          }
        />
        <SectionCard>
          <Typography color="text.secondary">Loading vehicle details...</Typography>
        </SectionCard>
      </Stack>
    );
  }

  if (vehicleQuery.isError || !vehicle) {
    return (
      <ErrorState
        title="Vehicle could not be loaded"
        description="The requested vehicle details are not available."
        onRetry={() => void vehicleQuery.refetch()}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Fleet"
        title={`${vehicle.brand} ${vehicle.model}`}
        description={`Vehicle #${vehicle.id} • ${vehicle.registrationNumber}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/change-history?entityName=VEHICLE&entityId=${vehicle.id}`)}
            >
              View history
            </Button>
            <Button variant="outlined" onClick={() => navigate('/vehicles')}>
              Back to list
            </Button>
          </Stack>
        }
      />

      <SectionCard
        title="Vehicle overview"
        description="Confirmed backend fields for the selected vehicle."
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Registration number" value={vehicle.registrationNumber} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Brand" value={vehicle.brand} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Model" value={vehicle.model} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Type" value={vehicle.type} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Fuel type" value={vehicle.fuelType} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Year of production" value={vehicle.yearOfProduction} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Capacity" value={formatCapacity(vehicle.capacity)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Stack alignItems="flex-start">
                <VehicleStatusChip status={vehicle.status} />
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard
        title="Status change"
        description="Uses the dedicated backend status endpoint with backend transition rules."
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
            onChange={(event) => setSelectedStatus(event.target.value as VehicleStatus)}
            sx={{ minWidth: { xs: '100%', md: 240 } }}
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
                id: vehicle.id,
                status: selectedStatus,
              });
            }}
          >
            Update status
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Final validation still stays on the backend. If the vehicle has active transport
          constraints, backend validation message will be shown.
        </Typography>
      </SectionCard>
    </Stack>
  );
}