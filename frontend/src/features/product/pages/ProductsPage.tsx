import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import ProductsTable from '../components/ProductsTable';
import ProductFormDialog from '../components/ProductFormDialog';
import { useProducts } from '../hooks/useProducts';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import type { SortState } from '../../../shared/types/common.types';
import type { ProductFormValues, ProductResponse } from '../types/product.types';
import type { ProductSearchParams } from '../api/productsApi';

type ProductFiltersState = {
  search: string;
  active: 'ALL' | 'ACTIVE' | 'INACTIVE';
};

function normalizeTextFilter(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeActiveFilter(value: ProductFiltersState['active']) {
  if (value === 'ACTIVE') {
    return true;
  }

  if (value === 'INACTIVE') {
    return false;
  }

  return undefined;
}

export default function ProductsPage() {
  const auth = useAuthStore();
  const isOverlord = auth.user?.role === ROLES.OVERLORD;
  const { showSnackbar } = useAppSnackbar();

  const canManage =
    auth.user?.role === ROLES.OVERLORD ||
    auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const [filters, setFilters] = useState<ProductFiltersState>({
    search: '',
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

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProductResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);

  const productSearchParams = useMemo<ProductSearchParams>(() => {
    return {
      search: normalizeTextFilter(filters.search),
      active: normalizeActiveFilter(filters.active),
      page,
      size,
      sort: buildSortParam(sort),
    };
  }, [filters, page, size, sort]);

  const query = useProducts(productSearchParams);
  const rows = query.data?.content ?? [];
  const hasActiveFilters = filters.search.trim().length > 0 || filters.active !== 'ALL';

  const clearFilters = () => {
    setPage(0);
    setFilters({ search: '', active: 'ALL' });
  };

  const activeFilterChips = [
    ...(filters.search.trim()
      ? [{ key: 'search', label: `Search: ${filters.search.trim()}`, onDelete: () => setFilters((prev) => ({ ...prev, search: '' })) }]
      : []),
    ...(filters.active !== 'ALL'
      ? [{ key: 'active', label: `Status: ${filters.active}`, onDelete: () => setFilters((prev) => ({ ...prev, active: 'ALL' })) }]
      : []),
  ];

  const companiesQuery = useCompanies(
    canManage && isOverlord && open && selected === null,
  );
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Catalog"
        title="Products"
        actions={
          canManage ? (
            <Button
              variant="contained"
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Create product
            </Button>
          ) : null
        }
      />

      <TableLayout
        title="Product list"
        description="Products are loaded through the real backend product endpoints and scoped by backend authorization."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => {
              setPage(0);
              setFilters((prev) => ({ ...prev, search: value }));
            }}
            searchPlaceholder="Search by name, SKU, unit, description or ID"
            onRefresh={() => {
              void query.refetch();
              if (canManage && isOverlord && open && selected === null) void companiesQuery.refetch();
            }}
            refreshDisabled={query.isFetching || companiesQuery.isFetching}
            onClearFilters={clearFilters}
            clearDisabled={query.isFetching || companiesQuery.isFetching || !hasActiveFilters}
            activeFilters={activeFilterChips}
          />
        }
        filters={
          <FilterPanel minColumnWidth={180}>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.active}
              onChange={(event) => {
                setPage(0);
                setFilters((prev) => ({ ...prev, active: event.target.value as ProductFiltersState['active'] }));
              }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </FilterPanel>
        }
        table={
          <ProductsTable
            rows={rows}
            loading={query.isLoading}
            error={query.isError}
            onRetry={() => { void query.refetch(); }}
            onEdit={(row) => { setSelected(row); setOpen(true); }}
            onDelete={(row) => { setDeleteTarget(row); }}
            canManage={canManage}
            pagination={
              <ServerTablePagination
                page={query.data}
                disabled={query.isFetching}
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
        <ProductFormDialog
          open={open}
          initialData={selected}
          companies={companiesQuery.data ?? []}
          showCompanySelect={isOverlord && selected === null}
          loading={create.isPending || update.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(values: ProductFormValues) => {
            const payload = {
              name: values.name.trim(),
              description: values.description?.trim() ?? '',
              sku: values.sku.trim(),
              unit: values.unit,
              price: Number(values.price),
              fragile: values.fragile,
              weight: Number(values.weight),
            };

            if (selected) {
              update.mutate(
                { id: selected.id, data: payload },
                {
                  onSuccess: () => {
                    setOpen(false);
                    setSelected(null);
                    showSnackbar({
                      message: 'Product updated successfully.',
                      severity: 'success',
                    });
                  },
                  onError: (error) => {
                    showSnackbar({
                      message: getErrorMessage(error),
                      severity: 'error',
                    });
                  },
                },
              );
              return;
            }

            create.mutate(
              {
                ...payload,
                companyId: values.companyId ? Number(values.companyId) : undefined,
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  showSnackbar({
                    message: 'Product created successfully.',
                    severity: 'success',
                  });
                },
                onError: (error) => {
                  showSnackbar({
                    message: getErrorMessage(error),
                    severity: 'error',
                  });
                },
              },
            );
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?`
            : ''
        }
        confirmText="Delete"
        confirmColor="error"
        isLoading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          remove.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              showSnackbar({
                message: 'Product deleted successfully.',
                severity: 'success',
              });
            },
            onError: (error) => {
              showSnackbar({
                message: getErrorMessage(error),
                severity: 'error',
              });
            },
          });
        }}
      />
    </Stack>
  );
}
