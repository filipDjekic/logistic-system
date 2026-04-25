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
import WarehouseFormDialog from '../components/WarehouseFormDialog';
import WarehousesTable from '../components/WarehousesTable';
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouseManagers,
  useWarehouses,
} from '../hooks/useWarehouses';
import type { SortState } from '../../../shared/types/common.types';
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
    active: 'ALL',
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
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      search: filters.search.trim() || undefined,
      status: filters.status === 'ALL' ? undefined : filters.status,
      active: filters.active === 'ALL' ? undefined : filters.active,
    }),
    [filters],
  );

  const warehousesQuery = useWarehouses({ ...queryFilters, page, size, sort: buildSortParam(sort) }, true);
  const managersQuery = useWarehouseManagers(canCreate && dialogOpen && dialogMode === 'create');
  const companiesQuery = useCompanies(canCreate && isOverlord && dialogOpen && dialogMode === 'create');
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();

  const rows = warehousesQuery.data?.content ?? [];

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

            <TextField
              select
              size="small"
              label="Active"
              value={String(filters.active)}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  active:
                    event.target.value === 'ALL'
                      ? 'ALL'
                      : event.target.value === 'true',
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
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
            rows={rows}
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
            pagination={
              <ServerTablePagination
                page={warehousesQuery.data}
                disabled={warehousesQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
            sort={sort}
            onSortChange={handleSortChange}
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
              const capacity = values.capacity === '' ? undefined : Number(values.capacity);
              const employeeId = values.employeeId === '' ? undefined : Number(values.employeeId);
              const companyId = values.companyId ? Number(values.companyId) : undefined;

              createWarehouseMutation.mutate({
                name: values.name,
                address: values.address,
                city: values.city,
                capacity: capacity as number,
                status: values.status,
                employeeId: employeeId as number,
                companyId,
              });
              return;
            }

            if (!selectedWarehouse) {
              return;
            }

            const updatedCapacity = values.capacity === '' ? undefined : Number(values.capacity);
            updateWarehouseMutation.mutate({
              id: selectedWarehouse.id,
              data: {
                name: values.name,
                address: values.address,
                city: values.city,
                capacity: updatedCapacity as number,
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