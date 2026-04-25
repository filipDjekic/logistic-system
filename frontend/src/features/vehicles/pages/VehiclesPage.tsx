import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useCompanies } from '../../companies/hooks/useCompanies';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import VehicleFormDialog from '../components/VehicleFormDialog';
import VehiclesTable from '../components/VehiclesTable';
import { useCreateVehicle } from '../hooks/useCreateVehicle';
import { useDeleteVehicle } from '../hooks/useDeleteVehicle';
import { useUpdateVehicle } from '../hooks/useUpdateVehicle';
import { useVehicles } from '../hooks/useVehicles';
import type { SortState } from '../../../shared/types/common.types';
import type {
  VehicleFiltersState,
  VehicleResponse,
  VehicleSearchParams,
} from '../types/vehicle.types';
import { vehicleStatusOptions, type VehicleSchemaValues } from '../validation/vehicleSchema';

function normalizeNumberFilter(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeTextFilter(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function VehiclesPage() {
  const auth = useAuthStore();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<VehicleFiltersState>({
    search: '',
    status: 'ALL',
    type: '',
    available: 'ALL',
    capacityFrom: '',
    capacityTo: '',
  });


  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'id', direction: 'desc' });

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const vehicleSearchParams = useMemo<VehicleSearchParams>(() => {
    return {
      search: normalizeTextFilter(filters.search),
      status: filters.status === 'ALL' ? undefined : filters.status,
      type: normalizeTextFilter(filters.type),
      available: filters.available === 'ALL' ? undefined : filters.available === 'true',
      capacityFrom: normalizeNumberFilter(filters.capacityFrom),
      capacityTo: normalizeNumberFilter(filters.capacityTo),
    };
  }, [filters]);

  const vehiclesQuery = useVehicles({ ...vehicleSearchParams, page, size, sort: buildSortParam(sort) }, true);
  const companiesQuery = useCompanies(
    canManage && isOverlord && dialogOpen && dialogMode === 'create',
  );
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

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
        description="Vehicle data is filtered by backend query parameters and company scope."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
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

            <TextField
              size="small"
              label="Type"
              value={filters.type}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, type: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            />

            <TextField
              select
              size="small"
              label="Available"
              value={filters.available}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  available: event.target.value as VehicleFiltersState['available'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 160 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="true">Available</MenuItem>
              <MenuItem value="false">Unavailable</MenuItem>
            </TextField>

            <TextField
              size="small"
              label="Capacity from"
              type="number"
              value={filters.capacityFrom}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, capacityFrom: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', md: 150 } }}
            />

            <TextField
              size="small"
              label="Capacity to"
              type="number"
              value={filters.capacityTo}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, capacityTo: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', md: 150 } }}
            />

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

            <Button
              variant="text"
              onClick={() => {
                setFilters({
                  search: '',
                  status: 'ALL',
                  type: '',
                  available: 'ALL',
                  capacityFrom: '',
                  capacityTo: '',
                });
              }}
            >
              Clear filters
            </Button>
          </Stack>

          <VehiclesTable
            rows={vehiclesQuery.data?.content ?? []}
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
            pagination={
              <ServerTablePagination
                page={vehiclesQuery.data}
                disabled={vehiclesQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
            sort={sort}
            onSortChange={handleSortChange}
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
