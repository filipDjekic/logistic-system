import { z } from 'zod';

export const inventoryDerivedStatusOptions = ['LOW_STOCK', 'RESERVED', 'OUT_OF_STOCK', 'AVAILABLE', 'SUFFICIENT'] as const;

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

export const inventoryFormSchema = z.object({
  warehouseId: z.union([z.number().positive('Warehouse is required'), z.literal('')]).refine(
    (value) => value !== '',
    'Warehouse is required',
  ),
  productId: z.union([z.number().positive('Product is required'), z.literal('')]).refine(
    (value) => value !== '',
    'Product is required',
  ),
  quantity: z.union([z.number(), z.literal('')]).refine(
    (value) => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
    'Quantity must be zero or greater',
  ),
  minStockLevel: z.union([z.number(), z.literal('')]).refine(
    (value) => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
    'Minimum stock level must be zero or greater',
  ),
});

export type InventoryFormSchemaValues = z.infer<typeof inventoryFormSchema>;
