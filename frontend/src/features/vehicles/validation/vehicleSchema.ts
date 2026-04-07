import { z } from 'zod';

export const vehicleStatusOptions = [
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
] as const;

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, 'Registration number is required')
    .max(20, 'Registration number must be at most 20 characters'),
  brand: z
    .string()
    .min(1, 'Brand is required')
    .max(20, 'Brand must be at most 20 characters'),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(20, 'Model must be at most 20 characters'),
  type: z
    .string()
    .min(1, 'Type is required')
    .max(20, 'Type must be at most 20 characters'),
  capacity: z
    .number({ error: 'Capacity is required' })
    .positive('Capacity must be greater than 0'),
  fuelType: z
    .string()
    .min(1, 'Fuel type is required')
    .max(20, 'Fuel type must be at most 20 characters'),
  yearOfProduction: z
    .number({ error: 'Year of production is required' })
    .min(1990, 'Year of production must be 1990 or later'),
  status: z.enum(vehicleStatusOptions, {
    error: 'Status is required',
  }),
});

export type VehicleSchemaValues = z.infer<typeof vehicleSchema>;