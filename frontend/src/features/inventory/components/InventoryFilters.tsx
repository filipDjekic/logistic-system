import { Grid, MenuItem, Stack, TextField } from '/material';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import { ProductSearchSelect } from '../../search-select/components/ProductSearchSelect';
import { WarehouseSearchSelect } from '../../search-select/components/WarehouseSearchSelect';
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
  return (
    <Stack spacing={2}>
      <TableToolbar
        searchValue={value.search}
        onSearchChange={(search) => onChange({ ...value, search })}
        searchPlaceholder="Search by warehouse, city, product, SKU or ID"
        onRefresh={onRefresh}
        refreshDisabled={loading}
        onClearFilters={() => onChange({ ...value, warehouseId: 'ALL', productId: 'ALL' })}
        clearDisabled={loading || (value.warehouseId === 'ALL' && value.productId === 'ALL')}
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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <WarehouseSearchSelect
            title="Warehouse filter"
            value={value.warehouseId === 'ALL' ? null : value.warehouseId}
            onSelect={(warehouse) => onChange({ ...value, warehouseId: warehouse.id })}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ProductSearchSelect
            title="Product filter"
            value={value.productId === 'ALL' ? null : value.productId}
            onSelect={(product) => onChange({ ...value, productId: product.id })}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
