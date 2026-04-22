import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ProductsTable from '../components/ProductsTable';
import ProductFormDialog from '../components/ProductFormDialog';
import { useProducts } from '../hooks/useProducts';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import type { ProductFormValues, ProductResponse } from '../types/product.types';

type ProductFiltersState = {
  search: string;
  active: 'ALL' | 'ACTIVE' | 'INACTIVE';
};

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

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProductResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);

  const query = useProducts();
  const companiesQuery = useCompanies(
    canManage && isOverlord && open && selected === null,
  );
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (query.data ?? []).filter((product) => {
      const matchesActive =
        filters.active === 'ALL' ||
        (filters.active === 'ACTIVE' && product.active) ||
        (filters.active === 'INACTIVE' && !product.active);

      const matchesSearch =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.unit.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        String(product.id).includes(search);

      return matchesActive && matchesSearch;
    });
  }, [filters, query.data]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Catalog"
        title="Products"
        description="Company admin has read-only visibility here. Product maintenance stays with warehouse operations or OVERLORD."
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

      <SectionCard
        title="Product list"
        description="Products are loaded through the real backend product endpoints and scoped by backend authorization."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by name, SKU, unit, description or ID"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.active}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  active: event.target.value as ProductFiltersState['active'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void query.refetch();

                if (canManage && isOverlord && open && selected === null) {
                  void companiesQuery.refetch();
                }
              }}
              disabled={query.isFetching || companiesQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <ProductsTable
            rows={filteredRows}
            loading={query.isLoading}
            error={query.isError}
            onRetry={() => {
              void query.refetch();
            }}
            onEdit={(row) => {
              setSelected(row);
              setOpen(true);
            }}
            onDelete={(row) => {
              setDeleteTarget(row);
            }}
            canManage={canManage}
          />
        </Stack>
      </SectionCard>

      {canManage ? (
        <ProductFormDialog
          open={open}
          initialData={selected}
          companies={companiesQuery.data ?? []}
          showCompanySelect={isOverlord && selected === null}
          onClose={() => setOpen(false)}
          onSubmit={(values: ProductFormValues) => {
            const payload = {
              name: values.name,
              description: values.description,
              sku: values.sku,
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