import { MenuItem, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { inventoryDerivedStatusOptions } from '../validation/inventorySchema';
import type { InventoryFiltersState } from '../types/inventory.types';

type InventoryFiltersProps = {
  value: InventoryFiltersState;
  loading?: boolean;
  onChange: (nextValue: InventoryFiltersState) => void;
  onRefresh: () => void;
};

export default function InventoryFilters({
  value,
  loading = false,
  onChange,
  onRefresh,
}: InventoryFiltersProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LookupOption | null>(null);

  const clearFilters = () => {
    setSelectedWarehouse(null);
    setSelectedProduct(null);
    onChange({ search: '', warehouseId: 'ALL', productId: 'ALL', status: 'ALL' });
  };

  const hasActiveFilters =
    value.search.trim().length > 0 ||
    value.warehouseId !== 'ALL' ||
    value.productId !== 'ALL' ||
    value.status !== 'ALL';

  const activeFilterChips = [
    ...(value.search.trim()
      ? [{ key: 'search', label: `Search: ${value.search.trim()}`, onDelete: () => onChange({ ...value, search: '' }) }]
      : []),
    ...(value.warehouseId !== 'ALL'
      ? [{ key: 'warehouseId', label: selectedWarehouse ? `Warehouse: ${selectedWarehouse.label}` : `Warehouse #${value.warehouseId}`, onDelete: () => {
          setSelectedWarehouse(null);
          onChange({ ...value, warehouseId: 'ALL' });
        } }]
      : []),
    ...(value.productId !== 'ALL'
      ? [{ key: 'productId', label: selectedProduct ? `Product: ${selectedProduct.label}` : `Product #${value.productId}`, onDelete: () => {
          setSelectedProduct(null);
          onChange({ ...value, productId: 'ALL' });
        } }]
      : []),
    ...(value.status !== 'ALL'
      ? [{ key: 'status', label: `Status: ${value.status}`, onDelete: () => onChange({ ...value, status: 'ALL' }) }]
      : []),
  ];

  return (
    <Stack spacing={2}>
      <TableToolbar
        searchValue={value.search}
        onSearchChange={(search) => onChange({ ...value, search })}
        searchPlaceholder="Search by warehouse, city, product, SKU or ID"
        onRefresh={onRefresh}
        refreshDisabled={loading}
        onClearFilters={clearFilters}
        clearDisabled={loading || !hasActiveFilters}
        activeFilters={activeFilterChips}
      />

      <FilterPanel minColumnWidth={180}>
        <TextField
          select
          size="small"
          label="Status"
          value={value.status}
          onChange={(event) =>
            onChange({
              ...value,
              status: event.target.value as InventoryFiltersState['status'],
            })
          }
        >
          <MenuItem value="ALL">All</MenuItem>
          {inventoryDerivedStatusOptions.map((status) => (
            <MenuItem key={status} value={status}>{status}</MenuItem>
          ))}
        </TextField>
      </FilterPanel>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <EntityLookupField
          label="Warehouse"
          entityType="warehouses"
          value={selectedWarehouse}
          onChange={(warehouse) => {
            setSelectedWarehouse(warehouse);
            onChange({ ...value, warehouseId: warehouse?.id ?? 'ALL' });
          }}
          disabled={loading}
        />
        <EntityLookupField
          label="Product"
          entityType="products"
          value={selectedProduct}
          onChange={(product) => {
            setSelectedProduct(product);
            onChange({ ...value, productId: product?.id ?? 'ALL' });
          }}
          disabled={loading}
        />
      </Stack>
    </Stack>
  );
}
