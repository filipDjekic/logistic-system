import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type {
  DerivedInventoryStatus,
  InventoryFiltersState,
  InventoryListRow,
} from '../types/inventory.types';

function getDerivedInventoryStatus(
  quantity: number,
  minStockLevel: number | null,
): DerivedInventoryStatus {
  if (minStockLevel !== null && quantity <= minStockLevel) {
    return 'LOW_STOCK';
  }

  return 'SUFFICIENT';
}

export function useInventory(filters: InventoryFiltersState) {
  return useQuery({
    queryKey: ['inventory', 'list', filters],
    queryFn: async () => {
      const [warehouses, products] = await Promise.all([
        inventoryApi.getWarehouses(),
        inventoryApi.getProducts(),
      ]);

      const warehousesToLoad =
        filters.warehouseId === 'ALL'
          ? warehouses
          : warehouses.filter((warehouse) => warehouse.id === filters.warehouseId);

      const inventoryGroups = await Promise.all(
        warehousesToLoad.map(async (warehouse) => ({
          warehouse,
          items: await inventoryApi.getInventoryByWarehouse(warehouse.id),
        })),
      );

      const productMap = new Map(products.map((product) => [product.id, product]));
      const warehouseMap = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

      const rows: InventoryListRow[] = inventoryGroups.flatMap(({ items }) =>
        items
          .map((item) => {
            const warehouse = warehouseMap.get(item.warehouseId);
            const product = productMap.get(item.productId);

            if (!warehouse || !product) {
              return null;
            }

            const availableQuantity = item.quantity - item.reservedQuantity;
            const derivedStatus = getDerivedInventoryStatus(item.quantity, item.minStockLevel);

            return {
              ...item,
              warehouseName: warehouse.name,
              warehouseCity: warehouse.city,
              warehouseStatus: warehouse.status,
              productName: product.name,
              productSku: product.sku,
              productUnit: product.unit,
              availableQuantity,
              derivedStatus,
            };
          })
          .filter((value): value is InventoryListRow => value !== null),
      );

      const search = filters.search.trim().toLowerCase();

      return rows.filter((row) => {
        const matchesWarehouse =
          filters.warehouseId === 'ALL' || row.warehouseId === filters.warehouseId;

        const matchesProduct =
          filters.productId === 'ALL' || row.productId === filters.productId;

        const matchesStatus =
          filters.status === 'ALL' || row.derivedStatus === filters.status;

        const matchesSearch =
          search.length === 0 ||
          row.productName.toLowerCase().includes(search) ||
          row.productSku.toLowerCase().includes(search) ||
          row.warehouseName.toLowerCase().includes(search) ||
          row.warehouseCity.toLowerCase().includes(search) ||
          String(row.productId).includes(search) ||
          String(row.warehouseId).includes(search);

        return matchesWarehouse && matchesProduct && matchesStatus && matchesSearch;
      });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}