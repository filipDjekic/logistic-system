import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useCompanies } from '../../companies/hooks/useCompanies';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import StatusOverview from '../../../shared/components/StatusOverview/StatusOverview';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import VehicleFormDialog from '../components/VehicleFormDialog';
import VehiclesTable from '../components/VehiclesTable';
import { useCreateVehicle } from '../hooks/useCreateVehicle';
import { useDeleteVehicle } from '../hooks/useDeleteVehicle';
import { useUpdateVehicle } from '../hooks/useUpdateVehicle';
import { useVehicles } from '../hooks/useVehicles';
import type { SortState } from '../../../shared/types/common.types';
import type { VehicleFiltersState, VehicleResponse, VehicleSearchParams } from '../types/vehicle.types';
import { vehicleStatusOptions, type VehicleSchemaValues } from '../validation/vehicleSchema';

function normalizeNumberFilter(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeTextFilter(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNumber(value: string | number | undefined) {
  if (value === undefined || String(value).trim().length === 0) {
    return null;
  }

  return Number(value);
}

const emptyFilters: VehicleFiltersState = {
  search: '',
  status: 'ALL',
  type: '',
  available: 'ALL',
  capacityFrom: '',
  capacityTo: '',
};

export default function VehiclesPage() {
  const auth = useAuthStore();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;
  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<VehicleFiltersState>(emptyFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'id', direction: 'desc' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const handleSortChange = (nextSort: SortState) => {
    setPage(0);
    setSort(nextSort);
  };

  const updateFilters = (next: Partial<VehicleFiltersState>) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const vehicleSearchParams = useMemo<VehicleSearchParams>(() => ({
    search: normalizeTextFilter(filters.search),
    status: filters.status === 'ALL' ? undefined : filters.status,
    type: normalizeTextFilter(filters.type),
    available: filters.available === 'ALL' ? undefined : filters.available === 'true',
    capacityFrom: normalizeNumberFilter(filters.capacityFrom),
    capacityTo: normalizeNumberFilter(filters.capacityTo),
  }), [filters]);

  const vehiclesQuery = useVehicles({ ...vehicleSearchParams, page, size, sort: buildSortParam(sort) }, true);
  const rows = useMemo(
    () => vehiclesQuery.data?.content ?? [],
    [vehiclesQuery.data?.content],
  );

  const statusOverviewItems = useMemo(
    () => vehicleStatusOptions.map((status) => ({
      value: status,
      count: rows.filter((row) => row.status === status).length,
    })),
    [rows],
  );

  const companiesQuery = useCompanies(canManage && isOverlord && dialogOpen && dialogMode === 'create');
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();
  const isSaving = createVehicleMutation.isPending || updateVehicleMutation.isPending;

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

      <TableLayout
        title="Vehicle list"
        description="Vehicle data is filtered by backend query parameters and company scope."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(search) => updateFilters({ search })}
            searchPlaceholder="Search by registration, brand, model, type, fuel or ID"
            onRefresh={() => {
              void vehiclesQuery.refetch();
              if (canManage && isOverlord && dialogOpen && dialogMode === 'create') {
                void companiesQuery.refetch();
              }
            }}
            refreshDisabled={vehiclesQuery.isFetching || companiesQuery.isFetching}
            onClearFilters={() => {
              setPage(0);
              setFilters(emptyFilters);
            }}
            clearDisabled={vehiclesQuery.isFetching}
          />
        }
        filters={
          <FilterPanel minColumnWidth={190}>
            <TextField select size="small" label="Status" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value as VehicleFiltersState['status'] })}>
              <MenuItem value="ALL">All</MenuItem>
              {vehicleStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>

            <TextField size="small" label="Type" value={filters.type} onChange={(event) => updateFilters({ type: event.target.value })} />

            <TextField select size="small" label="Available" value={filters.available} onChange={(event) => updateFilters({ available: event.target.value as VehicleFiltersState['available'] })}>
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="true">Available</MenuItem>
              <MenuItem value="false">Unavailable</MenuItem>
            </TextField>

            <TextField size="small" label="Capacity from" type="number" value={filters.capacityFrom} onChange={(event) => updateFilters({ capacityFrom: event.target.value })} />
            <TextField size="small" label="Capacity to" type="number" value={filters.capacityTo} onChange={(event) => updateFilters({ capacityTo: event.target.value })} />
          </FilterPanel>
        }
        summary={<StatusOverview items={statusOverviewItems} />}
        table={
          <VehiclesTable
            rows={rows}
            loading={vehiclesQuery.isLoading}
            error={vehiclesQuery.isError}
            onRetry={() => { void vehiclesQuery.refetch(); }}
            onEdit={(vehicle) => {
              if (!canManage) return;
              setDialogMode('edit');
              setSelectedVehicle(vehicle);
              setDialogOpen(true);
            }}
            onDelete={(vehicle) => {
              if (!canManage) return;
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
        }
      />

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
              vehicleModelId: Number(values.vehicleModelId),
              type: values.type,
              capacity: Number(values.capacity),
              maxWeight: Number(values.maxWeight),
              maxVolume: toOptionalNumber(values.maxVolume),
              maxItems: toOptionalNumber(values.maxItems),
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

            if (!selectedVehicle) return;
            updateVehicleMutation.mutate({ id: selectedVehicle.id, data: payload });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete vehicle"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.registrationNumber}"?` : ''}
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteVehicleMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteVehicleMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </Stack>
  );
}
