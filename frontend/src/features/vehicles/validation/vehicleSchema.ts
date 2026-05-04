import { z } from 'zod';

export const vehicleStatusOptions = [
  'AVAILABLE',
  'RESERVED',
  'IN_USE',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
] as const;

const requiredNumber = (requiredMessage: string, positiveMessage: string) =>
  z
    .union([z.string(), z.number()])
    .refine((value) => String(value).trim().length > 0, requiredMessage)
    .refine((value) => Number.isFinite(Number(value)), requiredMessage)
    .refine((value) => Number(value) > 0, positiveMessage);

const optionalPositiveNumber = (positiveMessage: string) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        String(value).trim().length === 0 ||
        (Number.isFinite(Number(value)) && Number(value) > 0),
      positiveMessage,
    );

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, 'Registration number is required')
    .max(20, 'Registration number must be at most 20 characters'),
  vehicleBrandId: z.string().min(1, 'Brand is required'),
  vehicleModelId: z.string().min(1, 'Model is required'),
  type: z.string().min(1, 'Type is required'),
  capacity: requiredNumber('Capacity is required', 'Capacity must be greater than 0'),
  maxWeight: requiredNumber('Max weight is required', 'Max weight must be greater than 0'),
  maxVolume: optionalPositiveNumber('Max volume must be greater than 0'),
  maxItems: optionalPositiveNumber('Max items must be greater than 0'),
  fuelType: z.string().min(1, 'Fuel type is required'),
  yearOfProduction: z
    .union([z.string(), z.number()])
    .refine((value) => String(value).trim().length > 0, 'Year of production is required')
    .refine((value) => Number.isInteger(Number(value)), 'Year of production must be a whole number')
    .refine((value) => Number(value) >= 1990, 'Year of production must be 1990 or later'),
  status: z.enum(vehicleStatusOptions, {
    error: 'Status is required',
  }),
  companyId: z.string().trim(),
});

export type VehicleSchemaValues = z.infer<typeof vehicleSchema>;