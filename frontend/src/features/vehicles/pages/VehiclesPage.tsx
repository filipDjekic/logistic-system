import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import VehicleFormDialog from '../components/VehicleFormDialog';
import VehiclesTable from '../components/VehiclesTable';
import { useCreateVehicle } from '../hooks/useCreateVehicle';
import { useUpdateVehicle } from '../hooks/useUpdateVehicle';
import { useVehicles } from '../hooks/useVehicles';
import type {
  VehicleFiltersState,
  VehicleResponse,
} from '../types/vehicle.types';
import { vehicleStatusOptions } from '../validation/vehicleSchema';

export default function VehiclesPage() {
  const auth = useAuthStore();

  const canCreate =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const canEdit = auth.user?.role === ROLES.OVERLORD;

  const [filters, setFilters] = useState<VehicleFiltersState>({
    search: '',
    status: 'ALL',
  });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const vehiclesQuery = useVehicles(true);
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (vehiclesQuery.data ?? []).filter((vehicle) => {
      const matchesStatus = filters.status === 'ALL' || vehicle.status === filters.status;

      const matchesSearch =
        search.length === 0 ||
        vehicle.registrationNumber.toLowerCase().includes(search) ||
        vehicle.brand.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search) ||
        vehicle.type.toLowerCase().includes(search) ||
        vehicle.fuelType.toLowerCase().includes(search) ||
        vehicle.status.toLowerCase().includes(search) ||
        String(vehicle.yearOfProduction).includes(search) ||
        String(vehicle.id).includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [filters, vehiclesQuery.data]);

  const isSaving =
    createVehicleMutation.isPending || updateVehicleMutation.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Fleet"
        title="Vehicles"
        description="Manage fleet records and review vehicle availability."
        actions={
          canCreate ? (
            <Button
              variant="contained"
              onClick={() => {
                setDialogMode('create');
                setSelectedVehicle(null);
                setDialogOpen(true);
              }}
            >
              Create vehicle
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Vehicle list"
        description="Vehicle data is loaded through backend company-scoped endpoints."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by registration, brand, model, type, fuel or ID"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as VehicleFiltersState['status'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {vehicleStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void vehiclesQuery.refetch();
              }}
              disabled={vehiclesQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <VehiclesTable
            rows={filteredRows}
            loading={vehiclesQuery.isLoading}
            error={vehiclesQuery.isError}
            onRetry={() => {
              void vehiclesQuery.refetch();
            }}
            onEdit={(vehicle) => {
              if (!canEdit) {
                return;
              }

              setDialogMode('edit');
              setSelectedVehicle(vehicle);
              setDialogOpen(true);
            }}
            canManage={canEdit}
          />
        </Stack>
      </SectionCard>

      {canCreate ? (
        <VehicleFormDialog
          open={dialogOpen}
          mode={dialogMode}
          initialData={selectedVehicle}
          loading={isSaving}
          onClose={() => setDialogOpen(false)}
          onSubmit={(values) => {
            if (dialogMode === 'create') {
              createVehicleMutation.mutate({
                registrationNumber: values.registrationNumber,
                brand: values.brand,
                model: values.model,
                type: values.type,
                capacity: Number(values.capacity),
                fuelType: values.fuelType,
                yearOfProduction: Number(values.yearOfProduction),
                status: values.status,
              });
              return;
            }

            if (!selectedVehicle) {
              return;
            }

            updateVehicleMutation.mutate({
              id: selectedVehicle.id,
              data: {
                registrationNumber: values.registrationNumber,
                brand: values.brand,
                model: values.model,
                type: values.type,
                capacity: Number(values.capacity),
                fuelType: values.fuelType,
                yearOfProduction: Number(values.yearOfProduction),
                status: values.status,
              },
            });
          }}
        />
      ) : null}
    </Stack>
  );
}