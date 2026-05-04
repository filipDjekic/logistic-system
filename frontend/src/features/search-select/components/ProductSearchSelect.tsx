import { useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useProducts } from '../../product/hooks/useProducts';
import type { ProductResponse } from '../../product/types/product.types';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn, SearchSelectFilterOption } from '../../../shared/search-select';

export type ProductSearchSelectProps = {
  title?: string;
  value?: number | null;
  onSelect: (product: ProductResponse) => void;
  activeOnly?: boolean;
  requirePositiveWeight?: boolean;
};

const productColumns: SearchSelectColumn<ProductResponse>[] = [
  {
    key: 'product',
    label: 'Product',
    render: (product) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          SKU: {product.sku}
        </Typography>
      </Stack>
    ),
  },
  { key: 'unit', label: 'Unit', render: (product) => product.unit, width: 100 },
  { key: 'weight', label: 'Weight', render: (product) => product.weight, width: 110 },
  { key: 'status', label: 'Status', render: (product) => <Chip size="small" color={product.active ? 'success' : 'default'} label={product.active ? 'ACTIVE' : 'INACTIVE'} />, width: 130 },
];

const statusOptions: SearchSelectFilterOption<'ALL' | 'ACTIVE' | 'INACTIVE'>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function ProductSearchSelect({
  title = 'Select product',
  value,
  onSelect,
  activeOnly = false,
  requirePositiveWeight = false,
}: ProductSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(activeOnly ? 'ACTIVE' : 'ALL');
  const debouncedSearch = useDebouncedValue(search).trim();
  const activeFilter = activeOnly || status === 'ACTIVE' ? true : status === 'INACTIVE' ? false : undefined;
  const productsQuery = useProducts({
    search: debouncedSearch || undefined,
    active: activeFilter,
    page: 0,
    size: 25,
    sort: 'name,asc',
  });

  const rows = useMemo(() => {
    return (productsQuery.data?.content ?? [])
      .filter((product) => {
        if (activeOnly && !product.active) return false;
        if (status === 'ACTIVE' && !product.active) return false;
        if (status === 'INACTIVE' && product.active) return false;
        if (requirePositiveWeight && product.weight <= 0) return false;

        return true;
      })
      .slice(0, 10);
  }, [activeOnly, debouncedSearch, productsQuery.data, requirePositiveWeight, status]);

  const selectedLabel = useMemo(() => rows.find((product) => product.id === value)?.name ?? null, [rows, value]);

  return (
    <SearchSelectPanel
      title={title}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, SKU, unit or description..."
      statusValue={activeOnly ? undefined : status}
      statusOptions={activeOnly ? undefined : statusOptions}
      onStatusChange={activeOnly ? undefined : setStatus}
      rows={rows}
      columns={productColumns}
      getRowKey={(product) => product.id}
      selectedId={value}
      selectedLabel={selectedLabel}
      onSelect={onSelect}
      loading={productsQuery.isFetching}
      error={productsQuery.error ? getErrorMessage(productsQuery.error) : null}
      emptyMessage="No products found."
    />
  );
}
