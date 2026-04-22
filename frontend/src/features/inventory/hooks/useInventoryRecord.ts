import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type { InventoryRecordDetails } from '../types/inventory.types';

export function useInventoryRecord(
  warehouseId: number | null,
  productId: number | null,
) {
  const isValidIds =
    Number.isInteger(warehouseId) &&
    (warehouseId as number) > 0 &&
    Number.isInteger(productId) &&
    (productId as number) > 0;

  return useQuery({
    queryKey: ['inventory', 'details', warehouseId, productId],
    queryFn: async (): Promise<InventoryRecordDetails> => {
      const record = await inventoryApi.getInventoryRecord(
        warehouseId as number,
        productId as number,
      );

      const [warehouseResult, productResult] = await Promise.allSettled([
        inventoryApi.getWarehouseById(warehouseId as number),
        inventoryApi.getProductById(productId as number),
      ]);

      const warehouse =
        warehouseResult.status === 'fulfilled' ? warehouseResult.value : null;

      const product =
        productResult.status === 'fulfilled' ? productResult.value : null;

      const availableQuantity =
        typeof record.availableQuantity === 'number'
          ? record.availableQuantity
          : record.quantity - record.reservedQuantity;

      const derivedStatus =
        record.minStockLevel !== null && record.quantity <= record.minStockLevel
          ? 'LOW_STOCK'
          : 'SUFFICIENT';

      return {
        record: {
          ...record,
          warehouseName: warehouse?.name ?? record.warehouseName,
          warehouseCity: warehouse?.city ?? null,
          warehouseStatus: warehouse?.status ?? null,
          productName: product?.name ?? record.productName,
          productSku: product?.sku ?? null,
          productUnit: product?.unit ?? null,
          availableQuantity,
          derivedStatus,
        },
        warehouse,
        product,
      };
    },
    enabled: isValidIds,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}