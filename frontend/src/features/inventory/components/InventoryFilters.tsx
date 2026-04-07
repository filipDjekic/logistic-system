import { Button, MenuItem, Stack, TextField } from '@mui/material';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import { inventoryDerivedStatusOptions } from '../validation/inventorySchema';
import type {
  InventoryFiltersState,
  InventoryProductOption,
  InventoryWarehouseOption,
} from '../types/inventory.types';

type InventoryFiltersProps = {
  value: InventoryFiltersState;
  warehouses: InventoryWarehouseOption[];
  products: InventoryProductOption[];
  loading?: boolean;
  onChange: (nextValue: InventoryFiltersState) => void;
  onRefresh: () => void;
};

export default function InventoryFilters({
  value,
  warehouses,
  products,
  loading = false,
  onChange,
  onRefresh,
}: InventoryFiltersProps) {
  return (
    <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5}>
      <SearchToolbar
        value={value.search}
        onChange={(search) => onChange({ ...value, search })}
        placeholder="Search by warehouse, city, product, SKU or ID"
        fullWidth
      />

      <TextField
        select
        size="small"
        label="Warehouse"
        value={value.warehouseId}
        onChange={(event) =>
          onChange({
            ...value,
            warehouseId:
              event.target.value === 'ALL' ? 'ALL' : Number(event.target.value),
          })
        }
        sx={{ minWidth: { xs: '100%', md: 220 } }}
      >
        <MenuItem value="ALL">All</MenuItem>
        {warehouses.map((warehouse) => (
          <MenuItem key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Product"
        value={value.productId}
        onChange={(event) =>
          onChange({
            ...value,
            productId:
              event.target.value === 'ALL' ? 'ALL' : Number(event.target.value),
          })
        }
        sx={{ minWidth: { xs: '100%', md: 220 } }}
      >
        <MenuItem value="ALL">All</MenuItem>
        {products.map((product) => (
          <MenuItem key={product.id} value={product.id}>
            {product.name}
          </MenuItem>
        ))}
      </TextField>

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
        sx={{ minWidth: { xs: '100%', md: 180 } }}
      >
        <MenuItem value="ALL">All</MenuItem>
        {inventoryDerivedStatusOptions.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="outlined"
        onClick={onRefresh}
        disabled={loading}
      >
        Refresh
      </Button>
    </Stack>
  );
}