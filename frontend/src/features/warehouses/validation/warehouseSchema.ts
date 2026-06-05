import { z } from 'zod';

const requiredNumber = (requiredMessage: string, positiveMessage: string) =>
  z
    .union([z.string(), z.number()])
    .refine((value) => String(value).trim().length > 0, requiredMessage)
    .refine((value) => Number.isFinite(Number(value)), requiredMessage)
    .refine((value) => Number(value) > 0, positiveMessage);

const optionalNumber = (message: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        String(value).trim().length === 0 ||
        Number.isFinite(Number(value)),
      message,
    );

export const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'Warehouse name is required.').max(100, 'Warehouse name can have at most 100 characters.'),
  address: z.string().trim().min(1, 'Address is required.').max(200, 'Address can have at most 200 characters.'),
  cityId: requiredNumber('City is required.', 'City is required.'),
  city: z.string().trim().max(100, 'City name can have at most 100 characters.').optional().nullable(),
  postalCode: z.string().trim().max(20, 'Postal code can have at most 20 characters.').optional().nullable(),
  countryId: z.union([z.string(), z.number(), z.null()]).refine(
    (value) => value !== null && String(value).trim().length > 0,
    'Country is required.',
  ),
  timezoneId: requiredNumber('Timezone is required.', 'Timezone is required.'),
  latitude: optionalNumber('Latitude must be a valid number.'),
  longitude: optionalNumber('Longitude must be a valid number.'),
  capacity: requiredNumber('Capacity is required.', 'Capacity must be greater than 0.'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'FULL', 'UNDER_MAINTENANCE']),
  employeeId: requiredNumber('Warehouse manager is required.', 'Warehouse manager is required.'),
  companyId: z.string().trim(),
  binTrackingEnabled: z.boolean(),
});

export type WarehouseSchemaValues = z.infer<typeof warehouseSchema>;
