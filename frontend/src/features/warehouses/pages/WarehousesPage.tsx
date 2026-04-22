import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useCompanies } from '../../companies/hooks/useCompanies';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import WarehouseFormDialog from '../components/WarehouseFormDialog';
import WarehousesTable from '../components/WarehousesTable';
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouseManagers,
  useWarehouses,
} from '../hooks/useWarehouses';
import type {
  WarehouseFiltersState,
  WarehouseFormValues,
  WarehouseResponse,
} from '../types/warehouse.types';

const warehouseStatusOptions = ['ACTIVE', 'INACTIVE', 'FULL', 'UNDER_MAINTENANCE'] as const;

export default function WarehousesPage() {
  const auth = useAuthStore();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;

  const canCreate =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const canManage =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<WarehouseFiltersState>({
    search: '',
    status: 'ALL',
  });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const warehousesQuery = useWarehouses(true);
  const managersQuery = useWarehouseManagers(canCreate && dialogOpen && dialogMode === 'create');
  const companiesQuery = useCompanies(canCreate && isOverlord && dialogOpen && dialogMode === 'create');
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (warehousesQuery.data ?? []).filter((warehouse) => {
      const matchesStatus =
        filters.status === 'ALL' || warehouse.status === filters.status;

      const matchesSearch =
        search.length === 0 ||
        warehouse.name.toLowerCase().includes(search) ||
        warehouse.city.toLowerCase().includes(search) ||
        warehouse.address.toLowerCase().includes(search) ||
        warehouse.status.toLowerCase().includes(search) ||
        (warehouse.managerName ?? '').toLowerCase().includes(search) ||
        (warehouse.companyName ?? '').toLowerCase().includes(search) ||
        String(warehouse.capacity).includes(search) ||
        String(warehouse.id).includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [filters, warehousesQuery.data]);

  const isSaving =
    createWarehouseMutation.isPending || updateWarehouseMutation.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Storage"
        title="Warehouses"
        description="Manage warehouse records, managers and capacity overview."
        actions={
          canCreate ? (
            <Button
              variant="contained"
              onClick={() => {
                setDialogMode('create');
                setSelectedWarehouse(null);
                setDialogOpen(true);
              }}
            >
              Create warehouse
            </Button>
          ) : null
        }
      />

      <SectionCard
        title="Warehouse list"
        description="Warehouse data is loaded through backend company-scoped endpoints."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by name, city, address, manager, company or ID"
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
                  status: event.target.value as WarehouseFiltersState['status'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {warehouseStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void warehousesQuery.refetch();

                if (canCreate && dialogOpen && dialogMode === 'create') {
                  void managersQuery.refetch();
                }

                if (canCreate && isOverlord && dialogOpen && dialogMode === 'create') {
                  void companiesQuery.refetch();
                }
              }}
              disabled={
                warehousesQuery.isFetching ||
                managersQuery.isFetching ||
                companiesQuery.isFetching
              }
            >
              Refresh
            </Button>
          </Stack>

          <WarehousesTable
            rows={filteredRows}
            loading={warehousesQuery.isLoading}
            error={warehousesQuery.isError}
            onRetry={() => {
              void warehousesQuery.refetch();
            }}
            onEdit={(warehouse) => {
              if (!canManage) {
                return;
              }

              setDialogMode('edit');
              setSelectedWarehouse(warehouse);
              setDialogOpen(true);
            }}
            onDelete={(warehouse) => {
              if (!canManage) {
                return;
              }

              setDeleteTarget(warehouse);
            }}
            canManage={canManage}
          />
        </Stack>
      </SectionCard>

      {canCreate ? (
        <WarehouseFormDialog
          open={dialogOpen}
          mode={dialogMode}
          initialData={selectedWarehouse}
          managers={managersQuery.data ?? []}
          companies={companiesQuery.data ?? []}
          isOverlord={isOverlord}
          loading={isSaving || managersQuery.isLoading || companiesQuery.isLoading}
          onClose={() => setDialogOpen(false)}
          onSubmit={(values: WarehouseFormValues) => {
            if (dialogMode === 'create') {
              createWarehouseMutation.mutate({
                name: values.name,
                address: values.address,
                city: values.city,
                capacity: Number(values.capacity),
                status: values.status,
                employeeId: Number(values.employeeId),
                companyId: values.companyId ? Number(values.companyId) : undefined,
              });
              return;
            }

            if (!selectedWarehouse) {
              return;
            }

            updateWarehouseMutation.mutate({
              id: selectedWarehouse.id,
              data: {
                name: values.name,
                address: values.address,
                city: values.city,
                capacity: Number(values.capacity),
              },
            });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete warehouse"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?`
            : ''
        }
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteWarehouseMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteWarehouseMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
            },
          });
        }}
      />
    </Stack>
  );
}