import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import OperationalMetrics from '../../../shared/components/OperationalMetrics/OperationalMetrics';
import WarehousesTable from '../components/WarehousesTable';
import {
  useDeleteWarehouse,
  useWarehouses,
} from '../hooks/useWarehouses';
import type { SortState } from '../../../shared/types/common.types';
import type {
  WarehouseFiltersState,
  WarehouseResponse,
} from '../types/warehouse.types';

const warehouseStatusOptions = ['ACTIVE', 'INACTIVE', 'FULL', 'UNDER_MAINTENANCE'] as const;

export default function WarehousesPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();

  const canCreate =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const canManage =
    auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const [filters, setFilters] = useState<WarehouseFiltersState>({
    search: '',
    status: 'ALL',
    active: 'ALL',
  });

  const [deleteTarget, setDeleteTarget] = useState<WarehouseResponse | null>(null);

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

  const queryFilters = useMemo(
    () => ({
      search: filters.search.trim() || undefined,
      status: filters.status === 'ALL' ? undefined : filters.status,
      active: filters.active === 'ALL' ? undefined : filters.active,
    }),
    [filters],
  );

  const warehousesQuery = useWarehouses({ ...queryFilters, page, size, sort: buildSortParam(sort) }, true);
  const deleteWarehouseMutation = useDeleteWarehouse();

  const rows = warehousesQuery.data?.content ?? [];

  const warehouseMetrics = useMemo(() => {
    const activeCount = rows.filter((warehouse) => warehouse.active && warehouse.status === 'ACTIVE').length;
    const inactiveCount = rows.filter((warehouse) => !warehouse.active || warehouse.status === 'INACTIVE').length;
    const maintenanceCount = rows.filter((warehouse) => warehouse.status === 'UNDER_MAINTENANCE').length;
    const fullCount = rows.filter((warehouse) => warehouse.status === 'FULL').length;
    const totalCapacity = rows.reduce((sum, warehouse) => sum + Number(warehouse.capacity ?? 0), 0);

    return [
      {
        label: 'Operational warehouses',
        value: activeCount,
        helper: `${inactiveCount} inactive on current page`,
        tone: activeCount > 0 ? 'success' as const : 'warning' as const,
        status: activeCount > 0 ? 'ACTIVE' : 'INACTIVE',
      },
      {
        label: 'Capacity view',
        value: totalCapacity.toLocaleString(),
        helper: `${rows.length} warehouse records loaded`,
        tone: 'info' as const,
      },
      {
        label: 'Attention needed',
        value: maintenanceCount + fullCount,
        helper: `${maintenanceCount} maintenance · ${fullCount} full`,
        tone: maintenanceCount + fullCount > 0 ? 'warning' as const : 'success' as const,
        status: maintenanceCount > 0 ? 'UNDER_MAINTENANCE' : fullCount > 0 ? 'FULL' : 'ACTIVE',
      },
    ];
  }, [rows]);

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
              onClick={() => navigate('/warehouses/create')}
            >
              Create warehouse
            </Button>
          ) : null
        }
      />

      <OperationalMetrics items={warehouseMetrics} />

      <TableLayout
        title="Warehouse list"
        description="Warehouse data is loaded through backend company-scoped endpoints."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by name, city, address, manager, company or ID"
            onRefresh={() => { void warehousesQuery.refetch(); }}
            refreshDisabled={warehousesQuery.isFetching}
          />
        }
        filters={
          <FilterPanel minColumnWidth={180}>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value as WarehouseFiltersState['status'] }))
              }
            >
              <MenuItem value="ALL">All</MenuItem>
              {warehouseStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Active"
              value={String(filters.active)}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  active: event.target.value === 'ALL' ? 'ALL' : event.target.value === 'true',
                }))
              }
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </FilterPanel>
        }
        table={
          <WarehousesTable
            rows={rows}
            loading={warehousesQuery.isLoading}
            error={warehousesQuery.isError}
            onRetry={() => { void warehousesQuery.refetch(); }}
            onEdit={(warehouse) => {
              if (!canManage) return;
              navigate(`/warehouses/${warehouse.id}/edit`);
            }}
            onDelete={(warehouse) => {
              if (!canManage) return;
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
        }
      />

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