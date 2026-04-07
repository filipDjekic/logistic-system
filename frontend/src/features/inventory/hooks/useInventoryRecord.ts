import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type { InventoryRecordDetails } from '../types/inventory.types';

export function useInventoryRecord(
  warehouseId: number | null,
  productId: number | null,
) {
  return useQuery({
    queryKey: ['inventory', 'details', warehouseId, productId],
    queryFn: async (): Promise<InventoryRecordDetails> => {
      const [record, warehouse, product] = await Promise.all([
        inventoryApi.getInventoryRecord(warehouseId as number, productId as number),
        inventoryApi.getWarehouseById(warehouseId as number),
        inventoryApi.getProductById(productId as number),
      ]);

      const availableQuantity = record.quantity - record.reservedQuantity;
      const derivedStatus =
        record.minStockLevel !== null && record.quantity <= record.minStockLevel
          ? 'LOW_STOCK'
          : 'SUFFICIENT';

      return {
        record: {
          ...record,
          warehouseName: warehouse.name,
          warehouseCity: warehouse.city,
          warehouseStatus: warehouse.status,
          productName: product.name,
          productSku: product.sku,
          productUnit: product.unit,
          availableQuantity,
          derivedStatus,
        },
        warehouse,
        product,
      };
    },
    enabled: Number.isFinite(warehouseId) && Number.isFinite(productId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}