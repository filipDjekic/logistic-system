import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.').max(100, 'Product name can have at most 100 characters.'),
  description: z.string().trim().max(255, 'Description can have at most 255 characters.'),
  sku: z.string().trim().min(1, 'SKU is required.').max(50, 'SKU can have at most 50 characters.'),
  unit: z.enum(['PIECE', 'KG', 'LITER', 'PALLET', 'BOX']),
  price: z.string()
    .trim()
    .min(1, 'Price is required.')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, 'Price must be greater than 0.'),
  fragile: z.boolean(),
  weight: z.string()
    .trim()
    .min(1, 'Weight is required.')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, 'Weight must be greater than 0.'),
  companyId: z.string(),
});
