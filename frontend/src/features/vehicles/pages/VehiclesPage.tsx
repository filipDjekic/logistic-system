import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { queryKeys } from '../../../core/constants/queryKeys';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useCompanies } from '../../companies/hooks/useCompanies';
import CsvImportDialog from '../../data-exchange/components/CsvImportDialog';
import { dataExchangeApi } from '../../data-exchange/api/dataExchangeApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import VehicleFormDialog from '../components/VehicleFormDialog';
import VehiclesTable from '../components/VehiclesTable';
import { useCreateVehicle } from '../hooks/useCreateVehicle';
import { useDeleteVehicle } from '../hooks/useDeleteVehicle';
import { useUpdateVehicle } from '../hooks/useUpdateVehicle';
import { useVehicles } from '../hooks/useVehicles';
import { vehiclesApi } from '../api/vehiclesApi';
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
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;
  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<VehicleFiltersState>(emptyFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'id', direction: 'desc' });
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

  const vehicleStatusCountParams = useMemo(() => ({
    search: vehicleSearchParams.search,
    type: vehicleSearchParams.type,
    available: vehicleSearchParams.available,
    capacityFrom: vehicleSearchParams.capacityFrom,
    capacityTo: vehicleSearchParams.capacityTo,
  }), [vehicleSearchParams]);

  const vehiclesQuery = useVehicles({ ...vehicleSearchParams, page, size, sort: buildSortParam(sort) }, true);
  const vehicleStatusCountsQuery = useQuery({
    queryKey: queryKeys.vehicles.statusCounts(vehicleStatusCountParams),
    queryFn: () => vehiclesApi.getStatusCounts(vehicleStatusCountParams),
    staleTime: 30_000,
  });
  const rows = useMemo(
    () => vehiclesQuery.data?.content ?? [],
    [vehiclesQuery.data?.content],
  );

  const companiesQuery = useCompanies(canManage && isOverlord && dialogOpen && dialogMode === 'create');
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();
  const isSaving = createVehicleMutation.isPending || updateVehicleMutation.isPending;
  const importMutation = useMutation({
    mutationFn: (file: File) => dataExchangeApi.importCsv('vehicles', file),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.root() });
      showSnackbar({
        message: result.failedRows > 0 ? 'Vehicle CSV import finished with row errors.' : 'Vehicles imported successfully.',
        severity: result.failedRows > 0 ? 'warning' : 'success',
      });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Fleet"
        title="Vehicles"
        description="Manage fleet records and review vehicle availability."
        actions={
          canManage ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<CloudUploadRoundedIcon />}
                onClick={() => {
                  importMutation.reset();
                  setImportDialogOpen(true);
                }}
              >
                Import CSV
              </Button>
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
            </Stack>
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
        table={
          <VehiclesTable
            rows={rows}
            loading={vehiclesQuery.isLoading}
            error={vehiclesQuery.isError}
            onRetry={() => { void Promise.all([vehiclesQuery.refetch(), vehicleStatusCountsQuery.refetch()]); }}
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
              registrationNumber: values.registrationNumber.trim(),
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
              }, {
                onSuccess: () => {
                  setDialogOpen(false);
                  setSelectedVehicle(null);
                },
              });
              return;
            }

            if (!selectedVehicle) return;
            updateVehicleMutation.mutate({ id: selectedVehicle.id, data: payload }, {
              onSuccess: () => {
                setDialogOpen(false);
                setSelectedVehicle(null);
              },
            });
          }}
        />
      ) : null}

      {canManage ? (
        <CsvImportDialog
          open={importDialogOpen}
          type="vehicles"
          title="Import vehicles from CSV"
          description="Use this import for fleet records prepared outside the system. OVERLORD imports must include companyId."
          loading={importMutation.isPending}
          result={importMutation.data ?? null}
          error={importMutation.error}
          onClose={() => setImportDialogOpen(false)}
          onImport={(file) => importMutation.mutate(file)}
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
