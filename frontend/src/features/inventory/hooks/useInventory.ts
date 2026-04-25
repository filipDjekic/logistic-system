import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  DerivedInventoryStatus,
  InventoryFiltersState,
  InventoryListRow,
  InventoryProductOption,
  InventoryWarehouseOption,
} from '../types/inventory.types';

function getDerivedInventoryStatus(
  availableQuantity: number,
  minStockLevel: number | null,
): DerivedInventoryStatus {
  if (minStockLevel !== null && availableQuantity <= minStockLevel) {
    return 'LOW_STOCK';
  }

  return 'SUFFICIENT';
}

type UseInventoryLookups = {
  warehouses: InventoryWarehouseOption[];
  products: InventoryProductOption[];
};

export function useInventory(filters: InventoryFiltersState & PageParams, lookups: UseInventoryLookups) {
  return useQuery({
    queryKey: ['inventory', 'list', filters],
    queryFn: async () => {
      const page = await inventoryApi.getInventory(filters);
      const rows = page.content;
      const productMap = new Map(lookups.products.map((product) => [product.id, product]));
      const warehouseMap = new Map(lookups.warehouses.map((warehouse) => [warehouse.id, warehouse]));

      const content = rows.map<InventoryListRow>((item) => {
        const warehouse = warehouseMap.get(item.warehouseId);
        const product = productMap.get(item.productId);
        const availableQuantity = item.availableQuantity ?? item.quantity - item.reservedQuantity;

        return {
          ...item,
          warehouseName: item.warehouseName ?? warehouse?.name ?? `Warehouse #${item.warehouseId}`,
          warehouseCity: warehouse?.city ?? null,
          warehouseStatus: warehouse?.status ?? null,
          productName: item.productName ?? product?.name ?? `Product #${item.productId}`,
          productSku: product?.sku ?? null,
          productUnit: product?.unit ?? null,
          availableQuantity,
          derivedStatus: getDerivedInventoryStatus(availableQuantity, item.minStockLevel ?? null),
        };
      });

      return { ...page, content } satisfies PageResponse<InventoryListRow>;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
