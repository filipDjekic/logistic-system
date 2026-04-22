import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useCompanies } from '../../companies/hooks/useCompanies';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import VehicleFormDialog from '../components/VehicleFormDialog';
import VehiclesTable from '../components/VehiclesTable';
import { useCreateVehicle } from '../hooks/useCreateVehicle';
import { useDeleteVehicle } from '../hooks/useDeleteVehicle';
import { useUpdateVehicle } from '../hooks/useUpdateVehicle';
import { useVehicles } from '../hooks/useVehicles';
import type {
  VehicleFiltersState,
  VehicleResponse,
} from '../types/vehicle.types';
import { vehicleStatusOptions, type VehicleSchemaValues } from '../validation/vehicleSchema';

export default function VehiclesPage() {
  const auth = useAuthStore();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<VehicleFiltersState>({
    search: '',
    status: 'ALL',
  });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const vehiclesQuery = useVehicles(true);
  const companiesQuery = useCompanies(
    canManage && isOverlord && dialogOpen && dialogMode === 'create',
  );
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

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
          canManage ? (
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
              sx={{ minWidth: { xs: '100%', md: 200 } }}
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

                if (canManage && isOverlord && dialogOpen && dialogMode === 'create') {
                  void companiesQuery.refetch();
                }
              }}
              disabled={vehiclesQuery.isFetching || companiesQuery.isFetching}
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
              if (!canManage) {
                return;
              }

              setDialogMode('edit');
              setSelectedVehicle(vehicle);
              setDialogOpen(true);
            }}
            onDelete={(vehicle) => {
              if (!canManage) {
                return;
              }

              setDeleteTarget(vehicle);
            }}
            canManage={canManage}
          />
        </Stack>
      </SectionCard>

      {canManage ? (
        <VehicleFormDialog
          open={dialogOpen}
          mode={dialogMode}
          initialData={selectedVehicle}
          companies={companiesQuery.data ?? []}
          showCompanySelect={isOverlord && dialogMode === 'create'}
          loading={isSaving}
          onClose={() => setDialogOpen(false)}
          onSubmit={(values: VehicleSchemaValues) => {
            const payload = {
              registrationNumber: values.registrationNumber,
              brand: values.brand,
              model: values.model,
              type: values.type,
              capacity: Number(values.capacity),
              fuelType: values.fuelType,
              yearOfProduction: Number(values.yearOfProduction),
              status: values.status,
            };

            if (dialogMode === 'create') {
              createVehicleMutation.mutate({
                ...payload,
                companyId: values.companyId ? Number(values.companyId) : undefined,
              });
              return;
            }

            if (!selectedVehicle) {
              return;
            }

            updateVehicleMutation.mutate({
              id: selectedVehicle.id,
              data: payload,
            });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete vehicle"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.registrationNumber}"?`
            : ''
        }
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteVehicleMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteVehicleMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
            },
          });
        }}
      />
    </Stack>
  );
}