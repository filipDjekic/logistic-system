import { z } from 'zod';

export const inventoryDerivedStatusOptions = ['LOW_STOCK', 'SUFFICIENT'] as const;

export const inventoryFiltersSchema = z.object({
  search: z.string(),
  warehouseId: z.union([z.number().positive(), z.literal('ALL')]),
  productId: z.union([z.number().positive(), z.literal('ALL')]),
  status: z.union([
    z.enum(inventoryDerivedStatusOptions),
    z.literal('ALL'),
  ]),
});

export type InventoryFiltersSchemaValues = z.infer<typeof inventoryFiltersSchema>;